# AIbitat

## 0.0.4

### Patch Changes

- 2f3970b: Move types around. Most types are going to be inside namespaces now
- 605d4e8: Trim anthropic response and add a bigger context window for the chat
- 1ff16a4: AIbitat prep to accept generic types

## 0.0.3

### Patch Changes

- 4eccd42: Added Anthropic Provider 🎊
- 19ebcc4: Fix a bug where the provider given to AIbitat was not replacing the
  default provider for channels

## 0.0.2

### Patch Changes

- aed887d: Fix an issue where the default model wasnt getting replaced when
  specifying on specific agent
- 2250784: Fix summarization bug on the `web-browsing` function
- 355026f: fix bug where it would thrown errors when model provided wrong JSON
- fee89ee: add cli for team builder

## 0.0.1

### Patch Changes

- 08c0571: - **Automated reply with loop prevention.** Chats are kept alive
  until the assistant interrupts the conversation.
  - **Group chats.** Agents chat with multiple other agents at the same time as
    if they were in a Whatsapp group. The next agent to reply is chosen based on
    the conversation and predicted most likely to reply.
- d4cde5f: Rename `ChatFlow` to `AIbitat` because npm complained about it being
  too similar to the package `chat-flow` and forced me using my username as
  scope... since I don't want go down that road I prefered changing the package
  name to something more unique
- f1c2aff: Added plugins support to the AIbitat instance. This allows you to
  extend the AIbitat instance with additional functionality.

  ```ts
  import { AIbitat } from 'aibitat';

  const aibitat = new AIbitat(...)
      .use({
          name: 'my-plugin',
          setup: (aibitat) => {
              // do something with the AIbitat instance
          },
      });
  ```

- d1bcbbe: Added `experimental_webBrowsing` plugin to allow you to browse the
  web from your AIbitat instance.

  ```ts
  import { AIbitat } from 'aibitat';
  import { experimental_webBrowsing } from 'aibitat/plugins';

  const aibitat = new AIbitat(...)
      .use(experimental_webBrowsing());
  ```

  NOTE: This plugin is still in development and is not yet ready for use in
  production.

- 864a067: fix a bug where compiled files were not being included in the npm
  package
- 98869b7: fix a bug where it was selecting the wrong the next participant in
  the group chat
- 937ac28: `.on` method is being replaced by especialized `.onXXX` methods
- 864a067: Added `aibitat/plugins` as a plugin directory. This allows you enable
  plugins to your AIbitat instance.

  ```ts
  import { AIbitat } from 'aibitat';
  import { cli } from 'aibitat/plugins';

  const aibitat = new AIbitat(...)
      .use(cli());
  ```

- 2cb4288: Gracefully handle API errors. Added `.onError` and `.retry` methods
  to let devs decide what to do with it
- 41aea69: added `onStart` event that is called when the chat starts.
- 7224499: ### 🎉 Function calling is here!!!

  You can now call functions from the conversation. This is a huge step forward
  in making Aibitat more powerful and flexible.

  To have your agents calling functions, use the `function` method to register a
  function:

  ```ts
  const aibitat = new AIbitat().function({
    name: 'unique-function-name',
    description: 'List of releases of AIbitat and the notes for each release.',
    parameters: {
      type: 'object',
      properties: {},
    },
    handler: async () => {
      const response = await fetch(
        'https://github.com/wladiston/aibitat/releases',
      )
      const html = await response.text()
      const text = cheerio.load(html).text()
      return text
    },
  })
  ```

- d09d857: Added `fileHistory` plugin to the list of available plugins.

## 0.0.1-beta.4

### Patch Changes

- f1c2aff: added plugin support
- 98869b7: fix a where it was selecting the wrong the next participant in the
  group
- 937ac28: `.on` method is being replaced by especialized `.onXXX` methods
- 41aea69: added `onStart` event

## 0.0.1-beta.3

### Patch Changes

- cabb37f: Rename `ChatFlow` to `AIbitat` because npm complained about it being
  too similar to the package `chat-flow` and forced me using my username as
  scope... since I don't want go down that road I prefered changing the package
  name to something more unique

## 0.0.1-beta.2

### Patch Changes

- fix module exports

## 0.0.1-beta.1

### Patch Changes

- add dist files in the exported module

## 0.0.1-beta.0

### Patch Changes

- - **Automated reply with loop prevention.** Chats are kept alive until the
    assistant interrupts the conversation.
  - **Group chats.** Agents chat with multiple other agents at the same time as
    if they were in a Whatsapp group. The next agent to reply is chosen based on
    the conversation and predicted most likely to reply.
