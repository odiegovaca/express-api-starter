import { z } from "zod/v4";

const envSchema = z.object({
  // Default seguro: sem NODE_ENV definido o app se comporta como producao.
  // Com o default anterior ("development"), esquecer a variavel no deploy fazia
  // o errorHandler devolver a pilha completa em todo 404 e 400.
  NODE_ENV: z.enum(["development", "production", "test"]).default("production"),
  PORT: z.coerce.number().default(3000),
});

try {
  // eslint-disable-next-line node/no-process-env
  envSchema.parse(process.env);
}
catch (error) {
  if (error instanceof z.ZodError) {
    console.error("Missing environment variables:", error.issues.flatMap(issue => issue.path));
  }
  else {
    console.error(error);
  }
  process.exit(1);
}

// eslint-disable-next-line node/no-process-env
export const env = envSchema.parse(process.env);
