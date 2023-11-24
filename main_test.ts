import { z, ZodSchema } from "zod";
import { assertEquals, assertThrows } from "assert";
import { parse, schema, Env } from "./main.ts";

function assertParsedSampleEqualsExpectedResult<T extends ZodSchema>({
  schema,
  sample,
  expected,
}: {
  schema: T;
  sample: Env<T>;
  expected?: z.infer<T>;
}) {
  const [parsed, env] = parse(schema, sample);
  assertEquals(parsed, expected);

  return {
    env,
    parsed,
    expected,
  };
}

Deno.test({
  name: "basic parsing test",
  fn() {
    assertParsedSampleEqualsExpectedResult({
      schema: schema.config({
        ARRAY_OF_VALUES: schema.stringArray(),
        USER: schema.json({
          NAME: schema.string(),
          AGE: schema.integer(),
          EMAIL: schema.email(),
        }),
      }),
      sample: {
        ARRAY_OF_VALUES: "value1,value2,value3",
        USER: `{
          "NAME": "John Doe",
          "AGE": 30,
          "EMAIL": "john@example.com"
        }`,
      },
      expected: {
        ARRAY_OF_VALUES: ["value1", "value2", "value3"],
        USER: {
          NAME: "John Doe",
          AGE: 30,
          EMAIL: "john@example.com",
        },
      },
    });
  },
});

Deno.test({
  name: "involved parsing test",
  fn() {
    const { env, expected } = assertParsedSampleEqualsExpectedResult({
      schema: schema.config({
        TARGET_EMAIL_ADDRESSES: schema.emailArray(),
        IGNORE_USERS: schema.emailArray(),
        SMTP_USER: schema.string(),
        SMTP_PASSWORD: schema.string(),
        SMTP_HOST: schema.domain(),
        SMTP_PORT: schema.port(),
        SMTP_SECURE: schema.boolean(),
        SAMPLE_RATE: schema.float(),
        ORDER: schema.integer(),
      }),
      sample: {
        TARGET_EMAIL_ADDRESSES: "test@email.com,another@test.com",
        IGNORE_USERS:
          'email1@example.com, "email2@example.com", email3@example.com',
        SMTP_USER: "email@example.com",
        SMTP_PASSWORD: "smtp_password",
        SMTP_HOST: "smtp.example.com",
        SMTP_PORT: "465",
        SMTP_SECURE: "true",
        SAMPLE_RATE: "2.5",
        ORDER: "15",
      },
      expected: {
        TARGET_EMAIL_ADDRESSES: ["test@email.com", "another@test.com"],
        IGNORE_USERS: [
          "email1@example.com",
          "email2@example.com",
          "email3@example.com",
        ],
        SMTP_USER: "email@example.com",
        SMTP_PASSWORD: "smtp_password",
        SMTP_HOST: "smtp.example.com",
        SMTP_PORT: 465,
        SMTP_SECURE: true,
        SAMPLE_RATE: 2.5,
        ORDER: 15,
      },
    });

    for (const key in expected) {
      assertEquals(
        env(key as keyof typeof expected),
        expected[key as keyof typeof expected]
      );
    }
  },
});

Deno.test({
  name: "env getter test",
  fn() {
    const { env, expected } = assertParsedSampleEqualsExpectedResult({
      schema: schema.config({
        EMAILS: schema.emailArray(),
        PORT: schema.port(),
        MAX_CONNECTIONS: schema.integer(),
        ENABLE_FEATURE: schema.boolean(),
      }),
      sample: {
        EMAILS: `test1@example.com, test2@example.com`,
        PORT: "3000",
        MAX_CONNECTIONS: "100",
        ENABLE_FEATURE: "true",
      },
      expected: {
        EMAILS: ["test1@example.com", "test2@example.com"],
        PORT: 3000,
        MAX_CONNECTIONS: 100,
        ENABLE_FEATURE: true,
      },
    });

    for (const key in expected) {
      assertEquals(
        env(key as keyof typeof expected),
        expected[key as keyof typeof expected]
      );
    }
  },
});

Deno.test({
  name: "empty config test",
  fn() {
    assertParsedSampleEqualsExpectedResult({
      schema: schema.config({
        PORT: schema.port().optional(),
        BROWSER: schema.boolean().optional(),
      }),
      sample: {},
      expected: {},
    });
  },
});

Deno.test({
  name: "empty config with defaults test",
  fn() {
    assertParsedSampleEqualsExpectedResult({
      schema: schema.config({
        PORT: schema.port().optional(),
        BROWSER: schema.boolean().optional().default("false"),
      }),
      sample: {},
      expected: {
        BROWSER: false,
      },
    });
  },
});

Deno.test({
  name: "validation test",
  fn() {
    assertThrows(() => {
      assertParsedSampleEqualsExpectedResult({
        schema: schema.config({
          ARRAY_OF_EMAILS: schema.emailArray(),
          USER: schema.json({
            NAME: schema.string(),
            AGE: schema.integer(),
            EMAIL: schema.email(),
          }),
        }),
        sample: {
          ARRAY_OF_VALUES: "email@example.com,value2",
          USER: `{
            "NAME": "John Doe",
            "AGE": 30,
            "EMAIL": "john@example.com"
          }`,
        },
      });
    });
  },
});

Deno.test({
  name: "string literal union parsing test",
  fn() {
    const nodeEnvOptions = ["production", "development", "testing"] as const;

    for (const option of nodeEnvOptions) {
      assertParsedSampleEqualsExpectedResult({
        schema: schema.config({
          NODE_ENV: schema.oneOf(nodeEnvOptions),
        }),
        sample: {
          NODE_ENV: option,
        },
        expected: {
          NODE_ENV: option,
        },
      });

      assertThrows(() => {
        assertParsedSampleEqualsExpectedResult({
          schema: schema.config({
            NODE_ENV: schema.oneOf(nodeEnvOptions),
          }),
          sample: {
            NODE_ENV: "invalid",
          },
        });
      });
    }
  },
});
