import {beforeEach, describe, expect, mock, test} from 'bun:test'
import OpenAI from 'openai'

import {AIbitat, type AIbitatProps} from './aibitat.ts'
import {RateLimitError} from './error.ts'
import {AIProvider} from './providers/index.ts'
import {type Message} from './types.ts'

// HACK: Mock the AI provider.
// This is still needed because Bun doesn't support mocking modules yet.
// Neither mocking the HTTP requests.
export const ai = {
  create: mock((messages: Message[]) => {}),
}
const provider = ai as unknown as AIProvider<OpenAI>

beforeEach(() => {
  ai.create.mockClear()
  ai.create.mockImplementation(() => Promise.resolve('TERMINATE'))
})

const defaultaibitat: AIbitatProps = {
  provider,
  nodes: {
    '🧑': '🤖',
  },
  config: {
    '🧑': {type: 'assistant'},
    '🤖': {type: 'agent'},
  },
}

const defaultStart = {
  from: '🧑',
  to: '🤖',
  content: '2 + 2 = 4?',
}

describe('direct message', () => {
  test('should reply a chat', async () => {
    const aibitat = new AIbitat(defaultaibitat)
    await aibitat.start(defaultStart)

    expect(aibitat.chats).toHaveLength(2)
    // expect human has the TERMINATE from the bot
    expect(aibitat.chats.at(-1)).toEqual({
      from: '🤖',
      to: '🧑',
      content: 'TERMINATE',
      state: 'success',
    })
  })

  test('should have a system message', async () => {
    const role = 'You are a 🤖.'

    const aibitat = new AIbitat({
      ...defaultaibitat,
      config: {
        ...defaultaibitat.config,
        '🤖': {type: 'agent', role},
      },
    })

    await aibitat.start(defaultStart)

    expect(ai.create).toHaveBeenCalledTimes(1)
    expect(ai.create.mock.calls[0][0][0].content).toEqual(role)
  })

  test('should keep chatting util its task is done', async () => {
    let i = 0
    ai.create.mockImplementation(() =>
      Promise.resolve(i >= 10 ? 'TERMINATE' : `... ${i++}`),
    )

    const aibitat = new AIbitat({
      ...defaultaibitat,
      config: {
        ...defaultaibitat.config,
        '🧑': {type: 'assistant', interrupt: 'NEVER'},
      },
    })

    await aibitat.start(defaultStart)

    // the chat gets in a loop if the bot doesn't terminate
    expect(aibitat.chats).toHaveLength(12)
  })

  test('should not engage in infinity conversations', async () => {
    ai.create.mockImplementation(() => Promise.resolve('...'))

    const aibitat = new AIbitat({
      ...defaultaibitat,
      maxRounds: 4,
      config: {
        ...defaultaibitat.config,
        '🧑': {type: 'assistant', interrupt: 'NEVER'},
      },
    })

    await aibitat.start(defaultStart)

    expect(ai.create).toHaveBeenCalledTimes(3)
  })

  test('should have initial messages', async () => {
    const aibitat = new AIbitat({
      ...defaultaibitat,
      maxRounds: 1,
      chats: [
        {
          from: '🧑',
          to: '🤖',
          content: '2 + 2 = 4?',
          state: 'success',
        },
      ],
    })

    await aibitat.start({
      from: '🤖',
      to: '🧑',
      content: '4',
    })

    expect(aibitat.chats).toHaveLength(3)
    expect(aibitat.chats.at(0)).toEqual({
      from: '🧑',
      to: '🤖',
      content: '2 + 2 = 4?',
      state: 'success',
    })
  })

  test('should trigger an event when a reply is received', async () => {
    const aibitat = new AIbitat(defaultaibitat)

    const callback = mock(() => {})
    aibitat.onMessage(callback)

    await aibitat.start(defaultStart)

    expect(callback).toHaveBeenCalledTimes(2)
  })

  test('should always interrupt interaction after each reply', async () => {
    ai.create.mockImplementation(() => Promise.resolve('...'))

    const aibitat = new AIbitat({
      ...defaultaibitat,
      interrupt: 'ALWAYS',
    })

    const callback = mock(() => {})
    aibitat.onInterrupt(callback)

    await aibitat.start(defaultStart)

    expect(callback).toHaveBeenCalledTimes(1)
  })

  test('should trigger an event when a interaction is needed', async () => {
    ai.create.mockImplementation(() => Promise.resolve('...'))

    const aibitat = new AIbitat({
      ...defaultaibitat,
      config: {
        ...defaultaibitat.config,
        '🤖': {type: 'agent', interrupt: 'ALWAYS'},
      },
    })

    const callback = mock(() => {})
    aibitat.onInterrupt(callback)

    await aibitat.start(defaultStart)

    expect(aibitat.chats).toHaveLength(3)
  })

  test('should auto-reply only when user skip engaging', async () => {
    ai.create.mockImplementation(() => Promise.resolve('...'))

    const aibitat = new AIbitat(defaultaibitat)
    // HACK: we should use `expect.assertions(1)` here but
    // bun has not implemented it yet.
    // so I have to work around it.
    // https://github.com/oven-sh/bun/issues/1825
    const p = new Promise(async resolve => {
      aibitat.onInterrupt(async () => {
        if (aibitat.chats.length < 4) {
          await aibitat.continue()
        } else {
          resolve(true)
        }
      })

      await aibitat.start(defaultStart)
    })

    expect(p).resolves.toBeTrue()
    expect(aibitat.chats[3].content).toBe('...')
    expect(aibitat.chats[3].state).toBe('success')
    expect(aibitat.chats).toHaveLength(5)
  })

  test('should continue conversation with user`s feedback', async () => {
    ai.create.mockImplementation(() => Promise.resolve('...'))

    const aibitat = new AIbitat({
      ...defaultaibitat,
      maxRounds: 10,
    })

    // HACK: we should use `expect.assertions(1)` here but
    // bun has not implemented it yet.
    // so I have to work around it.
    // https://github.com/oven-sh/bun/issues/1825
    const p = new Promise(async resolve => {
      aibitat.onInterrupt(a => {
        if (aibitat.chats.length < 4) {
          aibitat.continue('my feedback')
        } else {
          resolve(true)
        }
      })

      await aibitat.start(defaultStart)
    })

    expect(p).resolves.toBeTrue()
    expect(aibitat.chats[2].from).toBe('🧑')
    expect(aibitat.chats[2].to).toBe('🤖')
    expect(aibitat.chats[2].content).toBe('my feedback')
  })
})

describe('as a group', () => {
  const groupaibitat: AIbitatProps = {
    ...defaultaibitat,
    nodes: {
      '🧑': '🤖',
      '🤖': ['🐶', '😸', '🐭'],
    },
    config: {
      '🧑': {type: 'assistant'},
      '🤖': {type: 'manager', provider},
      '🐶': {type: 'agent'},
      '😸': {type: 'agent'},
      '🐭': {type: 'agent'},
    },
  }

  beforeEach(() => {
    ai.create.mockImplementation(x => {
      const roleMessage = x.find(y => y.content?.includes('next role'))

      if (roleMessage) {
        // pick a random node from groupaibitat.nodes
        const nodes = groupaibitat.nodes['🤖']
        const nextRole = nodes[Math.floor(Math.random() * nodes.length)]
        return Promise.resolve(nextRole)
      }

      return Promise.resolve('...')
    })
  })

  test('should chat to members of the group', async () => {
    const aibitat = new AIbitat(groupaibitat)
    await aibitat.start(defaultStart)

    expect(aibitat.chats).toHaveLength(11)
  })

  test.todo('should infer the next speaker', async () => {})

  test('should chat only a specific amount of rounds', async () => {
    const aibitat = new AIbitat({
      ...groupaibitat,
      config: {
        ...groupaibitat.config,
        '🤖': {type: 'manager', provider, maxRounds: 4},
      },
    })
    await aibitat.start(defaultStart)

    expect(aibitat.chats).toHaveLength(5)
  })
})

test.only('should call a function', async () => {
  // FIX: I can't mock the API yet
  // ai.create.mockImplementation(() =>
  //   Promise.resolve({
  //     function_call: {
  //       name: 'internet',
  //       arguments: '{"query": "I\'m feeling lucky"}',
  //     },
  //   }),
  // )

  const internet = mock((props: {query: string}) =>
    Promise.resolve("I'm feeling lucky"),
  )

  const aibitat = new AIbitat({
    ...defaultaibitat,
    config: {
      ...defaultaibitat.config,
      '🤖': {type: 'agent', functions: ['internet']},
    },
  })

  aibitat.function({
    name: 'internet',
    description: 'Searches the internet for a given query.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The query to search for.',
        },
      },
    },
    handler: internet,
  })

  await aibitat.start(defaultStart)

  expect(internet).toHaveBeenCalledTimes(1)
  expect(internet.mock.calls[0][0]).toEqual({query: "I'm feeling lucky"})
})

test.todo('should execute code', async () => {})

describe('when errors happen', () => {
  test('should escape unknown errors', async () => {
    const customError = new Error('unknown error')

    ai.create.mockImplementation(() => {
      throw customError
    })

    const aibitat = new AIbitat(defaultaibitat)

    try {
      await aibitat.start(defaultStart)
    } catch (error) {
      expect(error).toEqual(customError)
    }
  })

  test('should handle known errors', async () => {
    const error = new RateLimitError('known error!!!')
    ai.create.mockImplementation(() => {
      throw error
    })

    const aibitat = new AIbitat(defaultaibitat)
    aibitat.onError((_, error) => {
      expect(error).toEqual(error)
    })

    await aibitat.start(defaultStart)

    expect(aibitat.chats).toHaveLength(2)
    expect(aibitat.chats.at(-1)).toEqual({
      from: '🤖',
      to: '🧑',
      content: 'known error!!!',
      state: 'error',
    })
  })

  test('should trigger the error event', async () => {
    const error = new RateLimitError('401: Rate limit')
    ai.create.mockImplementation(() => {
      throw error
    })

    const aibitat = new AIbitat(defaultaibitat)

    const callback = mock((error: unknown) => {})
    aibitat.onError(callback)

    await aibitat.start(defaultStart)

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback.mock.calls[0][0]).toEqual(error)
  })

  test('should be able to retry', async () => {
    let i = 0
    const error = new RateLimitError('401: Rate limit')
    ai.create.mockImplementation(() => {
      if (i++ === 0) {
        throw error
      }

      return Promise.resolve({
        content: 'TERMINATE',
      })
    })

    const aibitat = new AIbitat(defaultaibitat)
    await aibitat.start(defaultStart)
    await aibitat.retry()

    expect(ai.create).toHaveBeenCalledTimes(2)
    expect(aibitat.chats).toHaveLength(2)
    expect(aibitat.chats.at(-1)).toEqual({
      from: '🤖',
      to: '🧑',
      content: 'TERMINATE',
      state: 'success',
    })
  })
})
