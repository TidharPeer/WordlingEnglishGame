export function selectEnglishVoice(voices) {
  const candidates = voices.filter(v => v.voice_id && (
    /^en(?:[-_]|$)|^english$/i.test(v.labels?.language || '') ||
    /american|british|english|australian|canadian/i.test(v.labels?.accent || '') ||
    v.verified_languages?.some(l => /^en(?:[-_]|$)|^english$/i.test(l.language || ''))
  ));
  return candidates.find(v => /narrat|warm|friendly/i.test(JSON.stringify(v.labels || {}))) || candidates[0];
}
export async function providerError(response) {
  const data = await response.json().catch(() => ({}));
  // Only allow known diagnostic codes; never echo provider messages or credentials.
  const code = data.detail?.code || data.detail?.status;
  const hints = {
    missing_permissions: 'The key lacks permission for this operation. Enable Voices read for automatic selection, or set ELEVENLABS_VOICE_ID to skip listing. Generation needs Text to Speech permission.',
    invalid_api_key: 'The API key was rejected. Check the local .env key and any shell variable overriding it.',
    paid_plan_required: 'This voice or operation requires a paid plan. Choose a voice available for API use on your current plan, or change your subscription.',
    payment_required: 'Payment or additional credits are required. Check your account balance and whether this voice is included in your API plan.',
    free_users_not_allowed: 'This voice is not available to free accounts through the API. Choose a voice supported by your plan.',
    quota_exceeded: 'The account has insufficient generation quota.',
    voice_not_found: 'The selected voice is not available to this account. Set ELEVENLABS_VOICE_ID to a voice in My Voices.',
  };
  return 'Provider HTTP ' + response.status + ': ' + (Object.hasOwn(hints, code) ? hints[code] : (response.status === 402 ? 'Payment or additional credits are required. Check your account balance and voice API plan eligibility.' : 'Check key permissions, voice access and account quota.'));
}
export function safeFailure(error) {
  if (error?.message?.startsWith('Provider HTTP ') || error?.message?.startsWith('No English voice')) return error.message;
  const code = error?.cause?.code || error?.code;
  if (['EACCES','ENOTFOUND','ECONNREFUSED','ECONNRESET','ETIMEDOUT','UNABLE_TO_VERIFY_LEAF_SIGNATURE'].includes(code)) return 'Connection failed (' + code + '). Check network, firewall and proxy settings.';
  if (['TimeoutError','AbortError'].includes(error?.name)) return 'The provider request timed out.';
  return 'Voice selection or file operation failed; check connectivity and local file permissions.';
}
