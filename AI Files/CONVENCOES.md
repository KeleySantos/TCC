# Convenções técnicas

- Código, identificadores de domínio, nomes de arquivos próprios, interface e documentação: português do Brasil. Nomes impostos por bibliotecas, protocolos e ferramentas externas podem permanecer no idioma de origem.
- Datas persistidas em UTC; apresentação em `America/Sao_Paulo` quando aplicável.
- TypeScript estrito; evitar `any`.
- Regras de negócio ficam fora de componentes React e não acessam o banco diretamente.
- Toda entrada de servidor é validada; autorização é conferida no servidor.
- Dados sintéticos são obrigatórios nesta versão. Não inserir dados de pessoas reais.
- Arquivos auxiliares de IA ficam exclusivamente em `AI Files/`.
- Antes de concluir alteração: executar lint, typecheck, testes pertinentes e build quando o projeto estiver configurado.
- Variáveis privadas ficam em `.env`; somente exemplos seguros ficam em `.env.example`.
