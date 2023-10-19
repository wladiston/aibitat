/**
 * The name and arguments of a function that should be called, as generated by the
 * model.
 */
export type FunctionCall = {
  /**
   * The arguments to call the function with, as generated by the model in JSON
   * format. Note that the model does not always generate valid JSON, and may
   * hallucinate parameters not defined by your function schema. Validate the
   * arguments in your code before calling your function.
   */
  arguments: string

  /**
   * The name of the function to call.
   */
  name: string
}

/**
 * OpenAI Chat API message.
 */
export type Message = {
  /**
   * The contents of the message. `content` is required for all messages, and may be
   * null for assistant messages with function calls.
   */
  content: string | null

  /**
   * The role of the messages author. One of `system`, `user`, `assistant`, or
   * `function`.
   */
  role: Role

  /**
   * The name and arguments of a function that should be called, as generated by the
   * model.
   */
  function_call?: FunctionCall

  /**
   * The name of the author of this message. `name` is required if role is
   * `function`, and it should be the name of the function whose response is in the
   * `content`. May contain a-z, A-Z, 0-9, and underscores, with a maximum length of
   * 64 characters.
   */
  name?: string
}

export interface Function {
  /**
   * The name of the function to be called. Must be a-z, A-Z, 0-9, or contain
   * underscores and dashes, with a maximum length of 64.
   */
  name: string

  /**
   * The parameters the functions accepts, described as a JSON Schema object. See the
   * [guide](https://platform.openai.com/docs/guides/gpt/function-calling) for
   * examples, and the
   * [JSON Schema reference](https://json-schema.org/understanding-json-schema/) for
   * documentation about the format.
   *
   * To describe a function that accepts no parameters, provide the value
   * `{"type": "object", "properties": {}}`.
   */
  parameters: Record<string, unknown>

  /**
   * A description of what the function does, used by the model to choose when and
   * how to call the function.
   */
  description?: string
}

/**
 * The role of the author of this message.
 */
export type Role = 'system' | 'user' | 'assistant' | 'function'
