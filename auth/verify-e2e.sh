#!/usr/bin/env bash
# Regression check for the full Hydra OAuth2 authorization_code flow used by
# the shopping-list app: authorize -> login -> consent -> token exchange ->
# introspection. Exercises the confidential `shopping-list-test` client
# (registered via create-test-client.sh) - NOT the browser SPA's PKCE flow,
# which must still be verified manually in a browser. Dev-only helper - not
# for production use. Requires the stack to be running (`yarn stack:up`) and
# both auth/create-*-client.sh scripts to have been run at least once.
set -euo pipefail

HYDRA_PUBLIC_URL="${HYDRA_PUBLIC_URL:-http://localhost:4444}"
HYDRA_ADMIN_URL="${HYDRA_ADMIN_URL:-http://localhost:4445}"
CLIENT_ID="shopping-list-test"
CLIENT_SECRET="${TEST_CLIENT_SECRET:-shopping-list-test-secret}"
REDIRECT_URI="${TEST_CLIENT_REDIRECT_URI:-http://localhost:4446/callback}"
SCOPE="openid offline profile email"
STATE="verify-$(date +%s)-$RANDOM"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ -z "${TEST_USER_EMAIL:-}" || -z "${TEST_USER_PASSWORD:-}" ]] && [[ -f "$ROOT_DIR/.env" ]]; then
	set -a
	# shellcheck disable=SC1091
	source "$ROOT_DIR/.env"
	set +a
fi
TEST_USER_EMAIL="${TEST_USER_EMAIL:-test@example.com}"
if [[ -z "${TEST_USER_PASSWORD:-}" ]]; then
	echo "TEST_USER_PASSWORD not set and not found in $ROOT_DIR/.env" >&2
	exit 1
fi

COOKIE_JAR="$(mktemp)"
trap 'rm -f "$COOKIE_JAR"' EXIT

# Prints the Location header of a GET response (errors out if none present).
location_of() {
	local headers
	headers="$(curl -sS -D - -o /dev/null -c "$COOKIE_JAR" -b "$COOKIE_JAR" "$@")"
	local location
	location="$(echo "$headers" | tr -d '\r' | sed -n 's/^[Ll]ocation: //p' | tail -n1)"
	if [[ -z "$location" ]]; then
		echo "Expected a redirect (Location header) from GET $* but got:" >&2
		echo "$headers" >&2
		exit 1
	fi
	echo "$location"
}

# Prints the Location header of a POST response (errors out if none present).
post_location_of() {
	local url="$1"
	shift
	local headers
	headers="$(curl -sS -D - -o /dev/null -c "$COOKIE_JAR" -b "$COOKIE_JAR" -X POST "$url" "$@")"
	local location
	location="$(echo "$headers" | tr -d '\r' | sed -n 's/^[Ll]ocation: //p' | tail -n1)"
	if [[ -z "$location" ]]; then
		echo "Expected a redirect (Location header) from POST $url but got:" >&2
		echo "$headers" >&2
		exit 1
	fi
	echo "$location"
}

# Extracts the value of a query-string parameter from a URL, preserving
# internal '=' characters (e.g. base64 padding) - do NOT use `cut -d=`.
query_param() {
	local url="$1" name="$2"
	echo "$url" | sed -n "s/.*[?&]${name}=\\([^&]*\\).*/\\1/p"
}

echo "1/6 Starting authorization request..."
authorize_url="${HYDRA_PUBLIC_URL}/oauth2/auth?client_id=${CLIENT_ID}&response_type=code&scope=$(echo "$SCOPE" | tr ' ' '+')&redirect_uri=${REDIRECT_URI}&state=${STATE}"
login_redirect="$(location_of "$authorize_url")"
login_challenge="$(query_param "$login_redirect" login_challenge)"
if [[ -z "$login_challenge" ]]; then
	echo "Could not extract login_challenge from: $login_redirect" >&2
	exit 1
fi
echo "   -> login_challenge=$login_challenge"

echo "2/6 Submitting test user credentials..."
verifier_redirect="$(post_location_of "$login_redirect" \
	--data-urlencode "email=${TEST_USER_EMAIL}" \
	--data-urlencode "password=${TEST_USER_PASSWORD}")"

echo "3/6 Resolving login verifier with Hydra..."
consent_redirect="$(location_of "$verifier_redirect")"
consent_challenge="$(query_param "$consent_redirect" consent_challenge)"
if [[ -z "$consent_challenge" ]]; then
	echo "Could not extract consent_challenge from: $consent_redirect" >&2
	exit 1
fi
echo "   -> consent_challenge=$consent_challenge"

echo "4/6 Granting consent..."
consent_verifier_redirect="$(post_location_of "$consent_redirect" --data-urlencode "scope=${SCOPE}")"

echo "5/6 Resolving consent verifier and capturing authorization code..."
final_redirect="$(location_of "$consent_verifier_redirect")"
code="$(query_param "$final_redirect" code)"
returned_state="$(query_param "$final_redirect" state)"
if [[ -z "$code" ]]; then
	echo "Could not extract authorization code from: $final_redirect" >&2
	exit 1
fi
if [[ "$returned_state" != "$STATE" ]]; then
	echo "State mismatch: sent $STATE, got $returned_state" >&2
	exit 1
fi
echo "   -> code=${code:0:12}... state OK"

echo "6/6 Exchanging code for tokens and introspecting access token..."
token_response="$(curl -sS -X POST "${HYDRA_PUBLIC_URL}/oauth2/token" \
	--data-urlencode "grant_type=authorization_code" \
	--data-urlencode "code=${code}" \
	--data-urlencode "redirect_uri=${REDIRECT_URI}" \
	--data-urlencode "client_id=${CLIENT_ID}" \
	--data-urlencode "client_secret=${CLIENT_SECRET}")"

access_token="$(echo "$token_response" | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')"
if [[ -z "$access_token" ]]; then
	echo "Token exchange failed:" >&2
	echo "$token_response" >&2
	exit 1
fi

introspect_response="$(curl -sS -X POST "${HYDRA_ADMIN_URL}/admin/oauth2/introspect" \
	--data-urlencode "token=${access_token}")"

if echo "$introspect_response" | grep -q '"active":true'; then
	echo ""
	echo "SUCCESS: full OAuth2 authorization_code flow verified end-to-end (active: true)."
	exit 0
else
	echo "Introspection did not return active:true:" >&2
	echo "$introspect_response" >&2
	exit 1
fi
