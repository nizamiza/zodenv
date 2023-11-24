import { ZodRawShape } from "zod";
import { assertEquals, assertThrows } from "assert";
import { parse, Env, InferFromShape, EnvShaper } from "./main.ts";

function assertParsedSampleEqualsExpectedResult<T extends ZodRawShape>({
  schema,
  sample,
  expected,
}: {
  schema: EnvShaper<T>;
  sample: Env<T>;
  expected?: InferFromShape<T>;
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
      schema: (e) => ({
        ARRAY_OF_VALUES: e.stringArray(),
        USER: e.json({
          NAME: e.string(),
          AGE: e.integer(),
          EMAIL: e.email(),
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
      schema: (e) => ({
        TARGET_EMAIL_ADDRESSES: e.emailArray(),
        IGNORE_USERS: e.emailArray(),
        SMTP_USER: e.string(),
        SMTP_PASSWORD: e.string(),
        SMTP_HOST: e.domain(),
        SMTP_PORT: e.port(),
        SMTP_SECURE: e.boolean(),
        SAMPLE_RATE: e.float(),
        ORDER: e.integer(),
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
      schema: (e) => ({
        EMAILS: e.emailArray(),
        PORT: e.port(),
        MAX_CONNECTIONS: e.integer(),
        ENABLE_FEATURE: e.boolean(),
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
      schema: (e) => ({
        PORT: e.port().optional(),
        BROWSER: e.boolean().optional(),
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
      schema: (e) => ({
        PORT: e.port().optional(),
        BROWSER: e.boolean().optional().default("false"),
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
        schema: (e) => ({
          ARRAY_OF_EMAILS: e.emailArray(),
          USER: e.json({
            NAME: e.string(),
            AGE: e.integer(),
            EMAIL: e.email(),
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
  name: "json parsing test",
  fn() {
    assertParsedSampleEqualsExpectedResult({
      schema: (e) => ({
        JSON: e.json({
          a: e.literal("string"),
          b: e.string(),
          c: e.object({
            d: e.array(
              e.object({
                h: e.literal("bar"),
                i: e.array(e.number()),
                j: e.tuple([e.literal("baz"), e.literal("boo")]),
              })
            ),
            k: e.object({
              l: e.literal("property"),
              m: e.literal("another-property"),
            }),
          }),
        }),
      }),
      sample: {
        JSON: `
          {
            "a": "string",
            "b": "any string value",
            "c": {
              "d": [
                {
                  "h": "bar",
                  "i": [1, 2, 3],
                  "j": ["baz", "boo"]
                },
                {
                  "h": "bar",
                  "i": [4, 5],
                  "j": ["baz", "boo"]
                }
              ],
              "k": {
                "l": "property",
                "m": "another-property"
              }
            }
          } 
        `,
      },
      expected: {
        JSON: {
          a: "string",
          b: "any string value",
          c: {
            d: [
              {
                h: "bar",
                i: [1, 2, 3],
                j: ["baz", "boo"],
              },
              {
                h: "bar",
                i: [4, 5],
                j: ["baz", "boo"],
              },
            ],
            k: {
              l: "property",
              m: "another-property",
            },
          },
        },
      },
    });
  },
});

Deno.test({
  name: "string literal union parsing test",
  fn() {
    const nodeEnvOptions = ["production", "development", "testing"] as const;

    for (const option of nodeEnvOptions) {
      assertParsedSampleEqualsExpectedResult({
        schema: (e) => ({
          NODE_ENV: e.oneOf(nodeEnvOptions),
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
          schema: (e) => ({
            NODE_ENV: e.oneOf(nodeEnvOptions),
          }),
          sample: {
            NODE_ENV: "invalid",
          },
        });
      });
    }
  },
});
