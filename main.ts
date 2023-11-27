import {
  ZodLiteral,
  ZodRawShape,
  z,
} from "https://deno.land/x/zod@v3.22.4/mod.ts";

type EnvValueTransformer<ParsedType, Value = string> = (
  value: Value
) => ParsedType;

function cleanStringArray(value: string) {
  return value.split(",").map((entry) => entry.replaceAll(`"`, "").trim());
}

export const transform = {
  emailArray(value: string) {
    return cleanStringArray(value).map((email) =>
      z.string().email().parse(email)
    );
  },
  stringArray(value: string) {
    return cleanStringArray(value).map((string) => z.string().parse(string));
  },
  numberArray(value: string) {
    return cleanStringArray(value).map((number) => z.number().parse(number));
  },
  json<Shape extends ZodRawShape>(shape: Shape) {
    return (value: string) => {
      return z.object(shape).parse(JSON.parse(value));
    };
  },
  boolean(value: string) {
    return value === "true";
  },
  integer(value: string | number) {
    return z.number().parse(Number.parseInt(value.toString()));
  },
  float(value: string | number) {
    return z.number().parse(Number.parseFloat(value.toString()));
  },
  port(value: string | number) {
    return z
      .number()
      .min(0)
      .max(65536)
      .parse(Number.parseInt(value.toString()));
  },
  url(value: string) {
    return z.string().url().parse(value);
  },
  email(value: string) {
    return z.string().email().parse(value);
  },
  domain(value: string) {
    return z
      .string()
      .regex(/^(?:www\.)?([a-zA-Z0-9-]+\.){1,}[a-zA-Z]{2,}$/)
      .parse(value);
  },
};

function useStringTransformer<T>(transformer: EnvValueTransformer<T>) {
  return z.string().transform(transformer);
}

function useStringOrNumberTransformer(
  transformer: EnvValueTransformer<number, string | number>
) {
  return z.string().or(z.number()).transform(transformer);
}

/**
 * e - stands for *"zod extended"*. Zod powered schemas designed towards parsing
 * common ENV variable formats.
 */
export const e = {
  ...z,
  /**
   * Schema for parsing union string literal values. E.g. `.env`:
   * ```env
   * NODE_ENV="production"
   * # NODE_ENV="testing"
   * # NODE_ENV="development"
   */
  oneOf<const T extends string>(literals: readonly T[]) {
    return z.union(
      literals.map((literal) => z.literal(literal)) as [
        ZodLiteral<T>,
        ZodLiteral<T>,
        ...ZodLiteral<T>[]
      ]
    );
  },
  /**
   * Schema for parsing boolean values. E.g.:
   * ```env
   * BOOLEAN_VALUE="true"
   * ```
   */
  boolean() {
    return z
      .union([z.literal("true"), z.literal("false")])
      .transform(transform.boolean);
  },
  /**
   * Schema for parsing email arrays defined as an array of strings. E.g.:
   * ```env
   * EMAIL_ARRAY="test@email.com,another@email.com"
   * ```
   */
  emailArray() {
    return useStringTransformer(transform.emailArray);
  },
  /**
   * Schema for parsing string arrays. E.g.:
   * ```env
   * STRING_ARRAY="value_1,value_2,value_3"
   * ```
   */
  stringArray() {
    return useStringTransformer(transform.stringArray);
  },
  /**
   * Schema for parsing number arrays. E.g.:
   * ```env
   * NUMBER_ARRAY="32,42,5124"
   * ```
   */
  numberArray() {
    return useStringTransformer(transform.numberArray);
  },
  /**
   * Schema for parsing json values. E.g.:
   * ```env
   * JSON_VALUE="{ \"a\": \"b\", \"c\": 2, \"d\": [\"value_1\", \"value_2\"] }"
   * ```
   */
  json<Shape extends ZodRawShape>(shape: Shape) {
    return z.string().transform(transform.json(shape));
  },
  /**
   * Schema for parsing integer values. E.g.:
   * ```env
   * INTEGER_VALUE="42"
   * ```
   */
  integer() {
    return useStringOrNumberTransformer(transform.integer);
  },
  /**
   * Schema for parsing float values. E.g.:
   * ```env
   * INTEGER_VALUE="42.00"
   * ```
   */
  float() {
    return useStringOrNumberTransformer(transform.float);
  },
  /**
   * Schema for parsing port values. Validates wether value is in valid port
   * range, i.e. between 0 and 65536. E.g.:
   * ```env
   * PORT_VALUE="8080"
   * ```
   */
  port() {
    return useStringOrNumberTransformer(transform.port);
  },
  /**
   * Schema for parsing URL values. E.g.:
   * ```env
   * URL_VALUE="https://localhost:3000"
   * ```
   */
  url() {
    return useStringTransformer(transform.url);
  },
  /**
   * Schema for parsing email values. E.g.:
   * ```env
   * EMAIL_VALUE="email@example.com"
   * ```
   */
  email() {
    return useStringTransformer(transform.email);
  },
  /**
   * Schema for parsing domain values. E.g.:
   * ```env
   * SMTP_HOST="smtp.example.com"
   * ```
   */
  domain() {
    return useStringTransformer(transform.domain);
  },
};

export type InferFromShape<T extends ZodRawShape> = z.infer<
  ReturnType<typeof z.object<T>>
>;

export type Env<Shape extends ZodRawShape> =
  | Record<string, string>
  | Partial<{
      [Key in keyof InferFromShape<Shape>]: InferFromShape<Shape>[Key] extends string
        ? InferFromShape<Shape>[Key]
        : string;
    }>;

export type EnvShaper<T extends ZodRawShape> = (envSchema: typeof e) => T;

export function parse<T extends ZodRawShape>(
  envShape: EnvShaper<T>,
  env: Env<T> = Deno.env.toObject()
): [
  parsedEnv: InferFromShape<T>,
  envGetter: <Key extends keyof InferFromShape<T>>(
    key: Key
  ) => InferFromShape<T>[Key]
] {
  const parsedEnv = z.object(envShape(e)).parse(env);
  return [parsedEnv, (key) => parsedEnv[key]];
}
