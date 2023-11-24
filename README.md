# ZodEnv - [Zod](https://zod.dev/) powered ENV parser

ZodEnv - is a utility for parsing and validating environment variables based on
predefined schemas using [Zod](https://zod.dev/).

## Installation

To use this package in your Deno project, you can import it directly from the
URL:

```typescript
import { parse } from "https://deno.land/x/zodenv/mod.ts";
```

## Usage

You can define schemas for your environment variables using the callback passed
to the `parse` function. This callback receives argument `e` which is an
extended `z` (Zod) object. It has all methods of a regular Zod object with some
extra features added.

Here is an examples:

```typescript
import { load } from "https://deno.land/std@0.208.0/dotenv/mod.ts";
import { parse } from "https://deno.land/x/zodenv/mod.ts";

await load({
  export: true,
});

const [parsed, env] = parse((e) => ({
  PORT: e.port().optional(),
  ENABLE_FEATURE: e.boolean().default(true),
}));

env("PORT"); // number | undefined
env("ENABLE_FEATURE"); // boolean
```

### Schema Definitions

The `e` object passed to the `parse` function's callback provides various extra
methods on top of Zod's methods to define schema rules for different types of
environment variables:

- `oneOf()`: Schema for parsing union string literal values.
- `boolean()`: Schema for parsing boolean values. Properly parses `"true"` and
  `"false"` string values
- `emailArray()`: Schema for parsing email arrays. Example:
  `EMAIL_ARRAY="email@test.com, another@test.com"`
- `stringArray()`: Schema for parsing string arrays. Example:
  `STRING_ARRAY="value_1,value_2,value_3"`
- `numberArray()`: Schema for parsing number arrays. Example:
  `NUMBER_ARRAY="42,17,44"`
- `json()`: Schema for parsing JSON values. Example: `JSON="{ \"a\": \"string\",
\"b\": 16 }"`
- `integer()`: Schema for parsing integer values.
- `float()`: Schema for parsing float values.
- `url()`: Schema for parsing URL values.
- `email()`: Schema for parsing email values.
- `port()`: Schema for parsing port values. Validates wether port is within the
  acceptable range from 0 to 65536.
- `domain()`: Schema for parsing domain values.

## Testing

This package includes test cases to ensure proper parsing and validation. To run
tests, execute:

```bash
deno test
```

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests for
any improvements or additional features.

## License

This package is licensed under the [MIT License](./LICENSE).
