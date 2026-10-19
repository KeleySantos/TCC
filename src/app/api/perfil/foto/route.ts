import { obterUsuarioAtual } from "@/servidor/autenticacao";
import { prisma } from "@/biblioteca/prisma";

export async function GET() {
  const usuario = await obterUsuarioAtual();
  if (!usuario) return new Response(null, { status: 401 });
  const perfil = await prisma.usuario.findUnique({ where: { id: usuario.id }, select: { fotoPerfil: true } });
  if (!perfil?.fotoPerfil) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(perfil.fotoPerfil), { headers: { "Content-Type": "image/webp", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
