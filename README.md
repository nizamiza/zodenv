# ZodEnv - [Zod](https://zod.dev/) powered ENV parser

ZodEnv - is a utility for parsing and validating environment variables based on predefined schemas using [Zod](https://zod.dev/).

## Installation

To use this package in your Deno project, you can import it directly from the URL:

```typescript
import { parse, schema } from "https://deno.land/x/zodenv/mod.ts";
```

## Usage

### Define Schemas

You can define schemas for your environment variables using the `schema` object provided by this package. Here are some examples:

```typescript
const envSchema = schema.config({
  PORT: schema.port().optional(),
  ENABLE_FEATURE: schema.boolean().default(true),
  // Add more schema definitions here...
});
```

### Parsing Environment Variables

Use the `parse` function to parse your environment variables based on the defined schema:

```typescript
const [parsedEnv, env] = parse(envSchema);
```

> NOTE: ZodEnv doesn't load ENV variables from your `.env` file. Use something like
> [dotenv](https://deno.land/std@0.207.0/dotenv/mod.ts) for parsing `.env` files.

The `parsedEnv` object contains the parsed and validated environment variables
based on the schema. You can access specific values using the `env`
function:

```typescript
env("PORT") // number | undefined
env("ENABLE_FEATURE") // boolean
```

### Full example

```typescript
import { load } from "https://deno.land/std@0.207.0/dotenv/mod.ts";
import { schema, parse } from "https://deno.land/x/zodenv/mod.ts";

await load({
  export: true,
});

const [parsedEnv, env] = parse(
  schema.config({
    PORT: schema.port().optional(),
    ENABLE_FEATURE: schema.boolean().default(true),
    // Add more schema definitions here...
  })
);

env("PORT") // number | undefined
env("ENABLE_FEATURE") // boolean
```

### Schema Definitions

The `schema` object provides various methods to define schema rules for different types of environment variables:

- `string()`: Schema for parsing basic string values.
- `number()`: Schema for parsing basic number values.
- `boolean()`: Schema for parsing boolean values.
- `emailArray()`: Schema for parsing email arrays.
- `stringArray()`: Schema for parsing string arrays.
- `numberArray()`: Schema for parsing number arrays.
- `json()`: Schema for parsing JSON values.
- `integer()`: Schema for parsing integer values.
- `float()`: Schema for parsing float values.
- `url()`: Schema for parsing URL values.
- `email()`: Schema for parsing email values.
- `port()`: Schema for parsing port values.
- `domain()`: Schema for parsing domain values.

## Testing

This package includes test cases to ensure proper parsing and validation of environment variables. To run tests, execute:

```bash
deno test
```

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests for any improvements or additional features.

## License

This package is licensed under the [MIT License](./LICENSE).