import "dotenv/config";
import { prisma } from "../src/biblioteca/prisma";
import { provisionarAdministradorIa } from "../src/servidor/ia/conta-admin";

try {
  const resultado = await provisionarAdministradorIa(process.env.SENHA_ADMIN_INICIAL?.trim() || undefined);
  console.log(JSON.stringify(resultado));
} finally {
  await prisma.$disconnect();
}
