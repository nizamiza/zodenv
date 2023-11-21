import { assertEquals, assertThrows } from "assert";
import { parse, schema as envSchema } from "@/main.ts";

Deno.test({
  name: "basic parsing test",
  fn() {
    const schema = envSchema.config({
      ARRAY_OF_VALUES: envSchema.stringArray(),
      USER: envSchema.json({
        NAME: envSchema.string(),
        AGE: envSchema.number(),
        EMAIL: envSchema.email(),
      }),
    });

    const sample = {
      ARRAY_OF_VALUES: "value1,value2,value3",
      USER: `{
        "NAME": "John Doe",
        "AGE": 30,
        "EMAIL": "john@example.com"
      }`,
    };

    const expected = {
      ARRAY_OF_VALUES: ["value1", "value2", "value3"],
      USER: {
        NAME: "John Doe",
        AGE: 30,
        EMAIL: "john@example.com",
      },
    };

    const [parsed] = parse(schema, sample);
    assertEquals(parsed, expected);
  },
});

Deno.test({
  name: "involved parsing test",
  fn() {
    const schema = envSchema.config({
      TARGET_EMAIL_ADDRESSES: envSchema.emailArray(),
      IGNORE_USERS: envSchema.emailArray(),
      SMTP_USER: envSchema.string(),
      SMTP_PASSWORD: envSchema.string(),
      SMTP_HOST: envSchema.domain(),
      SMTP_PORT: envSchema.port(),
      SMTP_SECURE: envSchema.boolean(),
      SAMPLE_RATE: envSchema.float(),
      ORDER: envSchema.integer(),
    });

    const sample = {
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
    };

    const expected = {
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
    };

    const [parsed, env] = parse(schema, sample);

    assertEquals(parsed, expected);

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
    const schema = envSchema.config({
      EMAILS: envSchema.emailArray(),
      PORT: envSchema.port(),
      MAX_CONNECTIONS: envSchema.number().positive(),
      ENABLE_FEATURE: envSchema.boolean(),
    });

    const sample = {
      EMAILS: `test1@example.com, test2@example.com`,
      PORT: "3000",
      MAX_CONNECTIONS: "100",
      ENABLE_FEATURE: "true",
    };

    const expected = {
      EMAILS: ["test1@example.com", "test2@example.com"],
      PORT: 3000,
      MAX_CONNECTIONS: 100,
      ENABLE_FEATURE: true,
    };

    const [, env] = parse(schema, sample);

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
    const schema = envSchema.config({
      PORT: envSchema.port().optional(),
      BROWSER: envSchema.boolean().optional(),
    });

    const sample = {};
    const expected = {};

    const [parsed] = parse(schema, sample);
    assertEquals(parsed, expected);
  },
});

Deno.test({
  name: "empty config with defaults test",
  fn() {
    const schema = envSchema.config({
      PORT: envSchema.port().optional(),
      BROWSER: envSchema.boolean().optional().default("false"),
    });

    const sample = {};

    const expected = {
      BROWSER: false,
    };

    const [parsed] = parse(schema, sample);
    assertEquals(parsed, expected);
  },
});

Deno.test({
  name: "validation test",
  fn() {
    const schema = envSchema.config({
      ARRAY_OF_EMAILS: envSchema.emailArray(),
      USER: envSchema.json({
        NAME: envSchema.string(),
        AGE: envSchema.number(),
        EMAIL: envSchema.email(),
      }),
    });

    const sample = {
      ARRAY_OF_VALUES: "email@example.com,value2",
      USER: `{
        "NAME": "John Doe",
        "AGE": 30,
        "EMAIL": "john@example.com"
      }`,
    };

    assertThrows(() => {
      parse(schema, sample);
    });
  },
});
