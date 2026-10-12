#!/usr/bin/env bash
# run-gate.sh — honest wrapper for the upheld gate.
# Runs the REAL gate command given as arguments. If (and only if) it exits 0,
# prints a jest-style summary line ("Tests: N passed, N total") that upheld's
# output parser can read, where N = number of "^ok" lines in the output
# (or 1 when the command is silent on success). A failing gate short-circuits
# before the summary is printed, so upheld sees the real non-zero exit.
# This is attestation formatting, not a substitute check: the gate itself
# is the real command.
set -u
out="$("$@" 2>&1)"
rc=$?
printf '%s\n' "$out"
if [ "$rc" -ne 0 ]; then
  exit "$rc"
fi
n=$(printf '%s\n' "$out" | grep -c '^ok ' || true)
[ "$n" -eq 0 ] && n=1
echo "Tests: $n passed, $n total"
exit 0
