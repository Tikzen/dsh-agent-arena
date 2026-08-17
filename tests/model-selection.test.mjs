import test from 'node:test'
import assert from 'node:assert/strict'
import {
  arenaChannelKey,
  installArenaModelSelection,
  isArenaEmptyResponseFailure,
  isArenaRateLimitFailure,
  normalizeArenaCooldownStatuses,
  normalizeArenaRequestLimit,
} from '../src/index.mjs'

// 模拟 DSH Agent 上下文中与模型选择相关的两个事件。
function fakeAgentCtx() {
  const handlers = new Map()
  return {
    on(event, handler) {
      handlers.set(event, handler)
      return () => handlers.delete(event)
    },
    // 依次触发一次 system-prompt/assemble 与一次 agent/request，模拟一轮真实请求。
    // handler 不存在（例如已被 dispose）时按“未安装选择适配器”返回基础值。
    async runTurn(assembledVariables = {}, baseRequest = {}) {
      const assemble = handlers.get('system-prompt/assemble')
      const requestHandler = handlers.get('agent/request')
      const assembled = assemble
        ? await assemble({}, {}, async () => ({ variables: { ...assembledVariables }, systemPrompt: '' }))
        : { variables: { ...assembledVariables } }
      const request = requestHandler
        ? await requestHandler({}, async () => ({ provider: 'base-provider', model: 'base-model', ...baseRequest }))
        : { provider: 'base-provider', model: 'base-model', ...baseRequest }
      return { assembled, request }
    },
  }
}

test('plain selection object is used as-is and stays stable', async () => {
  const agentCtx = fakeAgentCtx()
  installArenaModelSelection(agentCtx, { provider: 'p1', model: 'm1' })
  const first = await agentCtx.runTurn()
  assert.equal(first.assembled.variables.provider, 'p1')
  assert.equal(first.assembled.variables.model, 'm1')
  assert.equal(first.request.provider, 'p1')
  assert.equal(first.request.model, 'm1')

  const second = await agentCtx.runTurn()
  assert.equal(second.request.provider, 'p1')
  assert.equal(second.request.model, 'm1')
})

test('selection provider function is re-evaluated every request (live edits apply)', async () => {
  const current = { provider: 'p1', model: 'm1' }
  const agentCtx = fakeAgentCtx()
  installArenaModelSelection(agentCtx, () => ({ ...current }))

  const first = await agentCtx.runTurn()
  assert.equal(first.request.provider, 'p1')
  assert.equal(first.request.model, 'm1')

  // 会议进行中，角色 API 来源被修改：
  current.provider = 'p2'
  current.model = 'm2'

  const second = await agentCtx.runTurn()
  assert.equal(second.request.provider, 'p2')
  assert.equal(second.request.model, 'm2')
  assert.equal(second.assembled.variables.provider, 'p2')
  assert.equal(second.assembled.variables.model, 'm2')
})

test('dispose removes handlers so later requests keep base values', async () => {
  const agentCtx = fakeAgentCtx()
  const dispose = installArenaModelSelection(agentCtx, { provider: 'p1', model: 'm1' })
  dispose()
  const request = await agentCtx.runTurn()
  assert.equal(request.request.provider, 'base-provider')
  assert.equal(request.request.model, 'base-model')
})

test('request keeps inherited reasoning effort only when provided', async () => {
  const agentCtx = fakeAgentCtx()
  installArenaModelSelection(agentCtx, { provider: 'p1', model: 'm1', reasoningEffort: 'high' })
  const { request } = await agentCtx.runTurn()
  assert.equal(request.reasoningEffort, 'high')

  const agentCtx2 = fakeAgentCtx()
  installArenaModelSelection(agentCtx2, { provider: 'p1', model: 'm1' })
  const { request: request2 } = await agentCtx2.runTurn()
  assert.equal(Object.hasOwn(request2, 'reasoningEffort'), false)
})

test('shared channel key groups different models by provider configuration', () => {
  assert.equal(arenaChannelKey({ provider: 'oai', model: 'gpt-5.6-sol' }), 'oai')
  assert.equal(arenaChannelKey({ provider: 'oai', model: 'gpt-5.6-terra' }), 'oai')
  assert.notEqual(arenaChannelKey({ provider: 'oai', model: 'gpt-5.6-sol' }), arenaChannelKey({ provider: 'deepseek', model: 'deepseek-v4' }))
})

test('rate-limit detection covers HTTP 429 and provider rate-limit failures', () => {
  assert.equal(isArenaRateLimitFailure({ status: 429, message: 'Too many requests' }), true)
  assert.equal(isArenaRateLimitFailure({ code: 'RATE_LIMIT_EXCEEDED', message: 'provider rejected the request' }), true)
  assert.equal(isArenaRateLimitFailure({ failure: { status: 429, providerRetryAfterMs: 90_000 } }), true)
  assert.equal(isArenaRateLimitFailure(new Error('500: {"message":"分组 Codex 下模型 gpt-5.6-terra 的可用渠道不存在（retry）","code":"get_channel_failed"}')), true)
  assert.equal(isArenaRateLimitFailure({ status: 429, message: 'Upstream rate limit exceeded, please retry later' }), true)
  assert.equal(isArenaRateLimitFailure(new Error('500: 分组 Codex 下模型 gpt-5.6-terra 的可用渠道不存在'), [429]), false)
  assert.equal(isArenaRateLimitFailure({ status: 500, message: 'internal server error' }), true)
  assert.equal(isArenaRateLimitFailure({ status: 500, message: 'internal server error' }, [429]), false)
  assert.equal(isArenaRateLimitFailure({ status: 403, message: 'access denied' }, [403, 429]), true)
})

test('custom channel request limit and cooldown status list are normalized safely', () => {
  assert.equal(normalizeArenaRequestLimit(30), 30)
  assert.equal(normalizeArenaRequestLimit('120'), 120)
  assert.equal(normalizeArenaRequestLimit(0), 55)
  assert.equal(normalizeArenaRequestLimit(20_000), 55)
  assert.deepEqual(normalizeArenaCooldownStatuses([429, '500', 429, 403]), [429, 500, 403])
  assert.deepEqual(normalizeArenaCooldownStatuses([]), [])
  assert.deepEqual(normalizeArenaCooldownStatuses(['x', 99, 600]), [])
})

test('empty-response detection only matches completed responses without content', () => {
  assert.equal(isArenaEmptyResponseFailure(new Error('model "gpt-5.6-terra" returned a completed response with no content')), true)
  assert.equal(isArenaEmptyResponseFailure({ code: 'EMPTY_RESPONSE', message: 'empty completion' }), true)
  assert.equal(isArenaEmptyResponseFailure({ failure: { code: 'EMPTY_RESPONSE' } }), true)
  assert.equal(isArenaEmptyResponseFailure(new Error('context window exceeded')), false)
  assert.equal(isArenaEmptyResponseFailure(new Error('rate limit exceeded')), false)
})
