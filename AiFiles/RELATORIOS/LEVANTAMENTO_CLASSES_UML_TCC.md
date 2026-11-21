# Levantamento da estrutura de persistência e das classes para UML — TCC

**Data de referência:** 2 de novembro de 2026. **Agente ativo:** Guanabara.

## 1. Escopo, fontes e convenções

Levantamento documental do estado atual de prisma/schema.prisma, complementado por serviços e tipos efetivamente existentes. A única criação desta tarefa é este relatório, em AiFiles/RELATORIOS/LEVANTAMENTO_CLASSES_UML_TCC.md. Não foram executados banco, migrações, seed, geração Prisma, servidor, chamadas de IA ou testes de aplicação. Nenhum arquivo existente foi modificado. A solicitação de entrega de um novo Markdown é a exceção expressa à restrição de não modificar o projeto.

Fonte principal: [schema.prisma](../../prisma/schema.prisma). Hash SHA-256 do schema inspecionado: `5935d8a25271099b0cfee1d3f6bf4ee3a807b6317eccda4a95e1b9251ca6d30c`. O arquivo não usa @map nem @@map: os nomes de modelos e atributos correspondem aos nomes de tabelas/colunas esperados pelo Prisma. Não houve conexão ao SQLite para confirmar migrações aplicadas, contagens ou eventual divergência física; a completude deste inventário se refere ao schema implementado, não a uma introspecção de uma instância. Tabelas internas do SQLite ou de migração não são modelos de domínio e não estão incluídas.

**Resultado da extração:** 36 modelos, 25 enumerações e 59 relações com FK declarada. Cada relação é contada uma vez, no lado que armazena a FK. Campos de navegação inversa não geram relações adicionais.

- PK: chave primária simples ou participação na chave composta; FK: coluna referenciando outro modelo; UQ: unicidade simples. Restrições compostas constam sob cada modelo.
- T?: coluna opcional/nulável; T: coluna obrigatória. Valor padrão não torna a coluna opcional no banco, apenas pode dispensar envio pelo chamador. @updatedAt é gerenciado pelo Prisma.
- Campos cujo tipo é outro modelo são navegações do ORM e não colunas adicionais. T[] é uma coleção de relações, estruturalmente 0..*; T? é navegação 0..1; T é 1.
- Tipos escalares Prisma: String textual, Int inteiro, Float número de ponto flutuante, Boolean lógico, DateTime data/hora, Bytes binário. Enums são valores tipados, não tabelas.
- Campos *Json e EventoAuditoria.metadados continuam sendo String/String? no schema. Não há tipo Prisma Json nem FK implícita dentro desses textos.
- Cardinalidades expressam as restrições estruturais do schema; mínimos e limites adicionais do serviço são descritos separadamente. O relatório não inventa operações de instância para entidades Prisma.

## 2. Inventário completo e agrupamento funcional

| Modelo/tabela | Grupo | Finalidade | Relevância para UML |
|---|---|---|---|
| `Usuario` | Usuários e autenticação | Conta pessoal, credenciais derivadas, identificação e permissão técnica de administração de IA. | Essencial |
| `ConfiguracaoIa` | IA e infraestrutura | Credencial cifrada e estado de configuração de provedor; o fluxo vigente administra a configuração global Groq pela conta autorizada. | Técnico de suporte |
| `ModuloAprendizagem` | Organização do estudo | Contexto pessoal que reúne materiais, sessões, conceitos e evidências. | Essencial |
| `CompartilhamentoModulo` | Compartilhamento direto | Estado e segredo do código de compartilhamento direto de um módulo, separado de Salas. | Essencial no recorte de compartilhamento |
| `AcessoModuloCompartilhado` | Compartilhamento direto | Concessão de acesso do convidado ao módulo, com vaga e revogação. | Classe associativa essencial |
| `Sala` | Salas e participação modular | Agrupa módulos coletivos e identifica a conta proprietária. | Essencial |
| `MembroSala` | Compatibilidade histórica | Associação antiga de usuário à sala; não é a fonte atual de autorização modular. | Legado persistido |
| `ConviteSala` | Compatibilidade histórica | Convite antigo para a sala; preservado, distinto do convite atual por módulo. | Legado persistido |
| `SolicitacaoEntradaSala` | Compatibilidade histórica | Registro antigo de solicitação e decisão de ingresso na sala. | Legado persistido |
| `ModuloSala` | Salas e participação modular | Contexto coletivo dentro da sala, que agrega instâncias pessoais autorizadas. | Essencial |
| `ParticipacaoModuloSala` | Salas e participação modular | Participação do usuário em um módulo coletivo, com papel e situação; fonte atual de autorização. | Classe associativa essencial |
| `ConviteModuloSala` | Salas e participação modular | Convite por código hash, expiração e revogação para um módulo coletivo específico. | Essencial para ingresso |
| `VinculoModuloSala` | Salas e participação modular | Vincula uma participação e um módulo pessoal ao módulo coletivo, com situação e janela de compartilhamento. | Classe associativa essencial |
| `EvidenciaHistoricaModuloSala` | Salas e participação modular | Resumo pseudonimizado de sessão preservado no contexto coletivo após desligamento; não é evidência percentual de aprendizagem. | Auxiliar de histórico analítico |
| `PerfilAluno` | Compatibilidade histórica | Perfil antigo de aluno associado à conta e às matrículas; referência opcional em sessões antigas. | Legado persistido |
| `PerfilProfessor` | Compatibilidade histórica | Perfil antigo de professor associado à conta, às turmas e aprovações. | Legado persistido |
| `Turma` | Compatibilidade histórica | Turma do modelo anterior, identificada por nome/período e perfil docente. | Legado persistido |
| `Matricula` | Compatibilidade histórica | Associação antiga entre perfil de aluno e turma. | Associativa legada |
| `RecursoConteudo` | Materiais e conceitos | Material do módulo, com função educacional, formato, origem, conteúdo/URL opcionais e estado ativo. | Essencial |
| `AnaliseMaterial` | IA e materiais | Estado e resultado persistido da análise de conteúdo do material, com resumo, coleções serializadas e proveniência. | Essencial se representar análise de materiais |
| `ArquivoMaterial` | Materiais e conceitos | Metadados e chave de armazenamento do arquivo vinculado ao material. | Auxiliar técnico |
| `AprovacaoRecurso` | Compatibilidade histórica | Associação antiga de aprovação de recurso por perfil de professor, com situação e observação. | Associativa legada |
| `SessaoEstudo` | Sessões e estratégias | Registro de episódio de estudo com conta, módulo, intervalo, estado, percepções e contexto. | Essencial |
| `MetodoSessaoEstudo` | Sessões e estratégias | Armazena cada valor do enum MetodoEstudo selecionado na sessão; não referencia tabela de métodos. | Associativa técnica simplificável |
| `FormatoSessaoEstudo` | Sessões e estratégias | Armazena cada valor do enum FormatoConteudo selecionado na sessão; não referencia tabela de formatos. | Associativa técnica simplificável |
| `MaterialSessaoEstudo` | Sessões e estratégias | Associação muitos-para-muitos entre sessão e material utilizado. | Associativa simplificável |
| `ConceitoAprendizagem` | Materiais e conceitos | Conceito canônico contextualizado ao módulo, com chave normalizada, aliases e origem. | Essencial |
| `ConceitoMaterial` | Materiais e conceitos | Associa conceito e material, conservando trechos de suporte em JSON textual. | Classe associativa com atributo próprio |
| `ConceitoSessao` | Sessões e estratégias | Associação explícita entre conceito e sessão. | Associativa simplificável |
| `EvidenciaAprendizagem` | Evidências de aprendizagem | Resultado de atividade contextualizado ao módulo, com tipo, data e desempenho percentual opcional. | Essencial |
| `QuestaoEvidencia` | Evidências de aprendizagem | Questão identificada dentro de uma evidência, com tipo, resultado e pontuações opcionais. | Detalhamento relevante |
| `ConceitoEvidencia` | Evidências de aprendizagem | Associação entre conceito e evidência. | Associativa simplificável |
| `ConceitoQuestaoEvidencia` | Evidências de aprendizagem | Associação entre conceito e questão de evidência. | Associativa simplificável |
| `VinculoEvidenciaSessao` | Evidências de aprendizagem | Associação explícita entre evidência e sessão, com origem do vínculo e metadado histórico de confirmação. | Classe associativa relevante |
| `DesafioExperimentacao` | Sessões e estratégias | Contexto de experimentação de método associado à conta e ao módulo; sessões podem referenciá-lo. | Auxiliar de domínio; serviços preservados |
| `EventoAuditoria` | IA e infraestrutura | Registro técnico de ação, alvo textual, metadados e ator opcional. | Técnico de infraestrutura |

## 3. Atributos, tipos, obrigatoriedade e chaves

As tabelas seguintes enumeram todas as colunas escalares e enumerações, incluindo campos técnicos e legados. As navegações relacionais são listadas separadamente para evitar confundi-las com armazenamento físico. A declaração preserva os defaults reais. Índices não únicos são registrados para completude, mas não alteram cardinalidade.

### 3.1. Usuario

Conta pessoal, credenciais derivadas, identificação e permissão técnica de administração de IA. **Grupo:** Usuários e autenticação. **Classificação:** Essencial. Fonte: prisma/schema.prisma, linha 100.

| Atributo/coluna | Tipo Prisma | Obrigatório no banco | Chaves | Declaração de restrições/default |
|---|---|---|---|---|
| `id` | `String` | Sim | PK | `@id @default(cuid())` |
| `nome` | `String` | Sim | — | — |
| `nomeUsuario` | `String` | Sim | UQ | `@unique` |
| `email` | `String?` | Não (nulável) | UQ | `@unique` |
| `senhaHash` | `String` | Sim | — | — |
| `administradorIa` | `Boolean` | Sim | — | `@default(false)` |
| `fotoPerfil` | `Bytes?` | Não (nulável) | — | — |
| `fotoPerfilAtualizadaEm` | `DateTime?` | Não (nulável) | — | — |
| `papel` | `PapelUsuario` | Sim | — | `@default(ALUNO)` |
| `criadoEm` | `DateTime` | Sim | — | `@default(now())` |
| `atualizadoEm` | `DateTime` | Sim | — | `@updatedAt` |

**Navegações do ORM (não são colunas):**

| Campo | Tipo | Multiplicidade acessível a partir desta instância |
|---|---|---|
| `modulos` | `ModuloAprendizagem[]` | 0..* |
| `sessoesEstudo` | `SessaoEstudo[]` | 0..* |
| `desafios` | `DesafioExperimentacao[]` | 0..* |
| `perfilAluno` | `PerfilAluno?` | 0..1 |
| `perfilProfessor` | `PerfilProfessor?` | 0..1 |
| `eventosAuditoria` | `EventoAuditoria[]` | 0..* |
| `configuracoesIa` | `ConfiguracaoIa[]` | 0..* |
| `salasProprias` | `Sala[]` | 0..* |
| `membrosSalas` | `MembroSala[]` | 0..* |
| `convitesSalas` | `ConviteSala[]` | 0..* |
| `participacoesModulosSala` | `ParticipacaoModuloSala[]` | 0..* |
| `convitesModulosSala` | `ConviteModuloSala[]` | 0..* |
| `solicitacoesSala` | `SolicitacaoEntradaSala[]` | 0..* |
| `decisoesSala` | `SolicitacaoEntradaSala[]` | 0..* |
| `vinculosSala` | `VinculoModuloSala[]` | 0..* |
| `acessosModulosCompartilhados` | `AcessoModuloCompartilhado[]` | 0..* |

**Restrições compostas e índices:** nenhum declarado em nível de modelo.

### 3.2. ConfiguracaoIa

Credencial cifrada e estado de configuração de provedor; o fluxo vigente administra a configuração global Groq pela conta autorizada. **Grupo:** IA e infraestrutura. **Classificação:** Técnico de suporte. Fonte: prisma/schema.prisma, linha 215.

| Atributo/coluna | Tipo Prisma | Obrigatório no banco | Chaves | Declaração de restrições/default |
|---|---|---|---|---|
| `id` | `String` | Sim | PK | `@id @default(cuid())` |
| `usuarioId` | `String` | Sim | FK → Usuario.id | — |
| `provedor` | `ProvedorIa` | Sim | — | — |
| `chaveCifrada` | `String` | Sim | — | — |
| `vetorInicializacao` | `String` | Sim | — | — |
| `etiquetaAutenticacao` | `String` | Sim | — | — |
| `ativa` | `Boolean` | Sim | — | `@default(true)` |
| `estadoUltimoTeste` | `EstadoConfiguracaoIa` | Sim | — | `@default(NAO_TESTADA)` |
| `ultimoTesteEm` | `DateTime?` | Não (nulável) | — | — |
| `bloqueadaAte` | `DateTime?` | Não (nulável) | — | — |
| `criadoEm` | `DateTime` | Sim | — | `@default(now())` |
| `atualizadoEm` | `DateTime` | Sim | — | `@updatedAt` |

**Navegações do ORM (não são colunas):**

| Campo | Tipo | Multiplicidade acessível a partir desta instância |
|---|---|---|
| `usuario` | `Usuario` | 1 |

**Restrições compostas e índices:** `@@unique([usuarioId, provedor])`; `@@index([usuarioId, ativa])`; `@@index([bloqueadaAte])`

### 3.3. ModuloAprendizagem

Contexto pessoal que reúne materiais, sessões, conceitos e evidências. **Grupo:** Organização do estudo. **Classificação:** Essencial. Fonte: prisma/schema.prisma, linha 235.

| Atributo/coluna | Tipo Prisma | Obrigatório no banco | Chaves | Declaração de restrições/default |
|---|---|---|---|---|
| `id` | `String` | Sim | PK | `@id @default(cuid())` |
| `usuarioId` | `String` | Sim | FK → Usuario.id | — |
| `identificador` | `String` | Sim | — | — |
| `titulo` | `String` | Sim | — | — |
| `descricao` | `String` | Sim | — | — |
| `arquivado` | `Boolean` | Sim | — | `@default(false)` |
| `rascunho` | `Boolean` | Sim | — | `@default(false)` |
| `criadoEm` | `DateTime` | Sim | — | `@default(now())` |
| `atualizadoEm` | `DateTime` | Sim | — | `@updatedAt` |

**Navegações do ORM (não são colunas):**

| Campo | Tipo | Multiplicidade acessível a partir desta instância |
|---|---|---|
| `usuario` | `Usuario` | 1 |
| `materiais` | `RecursoConteudo[]` | 0..* |
| `sessoesEstudo` | `SessaoEstudo[]` | 0..* |
| `desafios` | `DesafioExperimentacao[]` | 0..* |
| `vinculosSala` | `VinculoModuloSala[]` | 0..* |
| `conceitos` | `ConceitoAprendizagem[]` | 0..* |
| `evidencias` | `EvidenciaAprendizagem[]` | 0..* |
| `compartilhamento` | `CompartilhamentoModulo?` | 0..1 |
| `acessosCompartilhados` | `AcessoModuloCompartilhado[]` | 0..* |

**Restrições compostas e índices:** `@@unique([usuarioId, identificador])`; `@@index([usuarioId, arquivado])`; `@@index([usuarioId, arquivado, rascunho])`

### 3.4. CompartilhamentoModulo

Estado e segredo do código de compartilhamento direto de um módulo, separado de Salas. **Grupo:** Compartilhamento direto. **Classificação:** Essencial no recorte de compartilhamento. Fonte: prisma/schema.prisma, linha 260.

| Atributo/coluna | Tipo Prisma | Obrigatório no banco | Chaves | Declaração de restrições/default |
|---|---|---|---|---|
| `id` | `String` | Sim | PK | `@id @default(cuid())` |
| `moduloId` | `String` | Sim | FK → ModuloAprendizagem.id; UQ | `@unique` |
| `codigoHash` | `String?` | Não (nulável) | UQ | `@unique` |
| `chaveCifrada` | `String?` | Não (nulável) | — | — |
| `vetorInicializacao` | `String?` | Não (nulável) | — | — |
| `etiquetaAutenticacao` | `String?` | Não (nulável) | — | — |
| `atualizadoEm` | `DateTime` | Sim | — | `@updatedAt` |

**Navegações do ORM (não são colunas):**

| Campo | Tipo | Multiplicidade acessível a partir desta instância |
|---|---|---|
| `modulo` | `ModuloAprendizagem` | 1 |

**Restrições compostas e índices:** nenhum declarado em nível de modelo.

### 3.5. AcessoModuloCompartilhado

Concessão de acesso do convidado ao módulo, com vaga e revogação. **Grupo:** Compartilhamento direto. **Classificação:** Classe associativa essencial. Fonte: prisma/schema.prisma, linha 271.

| Atributo/coluna | Tipo Prisma | Obrigatório no banco | Chaves | Declaração de restrições/default |
|---|---|---|---|---|
| `id` | `String` | Sim | PK | `@id @default(cuid())` |
| `moduloId` | `String` | Sim | FK → ModuloAprendizagem.id | — |
| `convidadoId` | `String` | Sim | FK → Usuario.id | — |
| `vaga` | `Int?` | Não (nulável) | — | — |
| `concedidoEm` | `DateTime` | Sim | — | `@default(now())` |
| `revogadoEm` | `DateTime?` | Não (nulável) | — | — |

**Navegações do ORM (não são colunas):**

| Campo | Tipo | Multiplicidade acessível a partir desta instância |
|---|---|---|
| `modulo` | `ModuloAprendizagem` | 1 |
| `convidado` | `Usuario` | 1 |

**Restrições compostas e índices:** `@@unique([moduloId, convidadoId])`; `@@unique([moduloId, vaga])`; `@@index([convidadoId, vaga])`

### 3.6. Sala

Agrupa módulos coletivos e identifica a conta proprietária. **Grupo:** Salas e participação modular. **Classificação:** Essencial. Fonte: prisma/schema.prisma, linha 286.

| Atributo/coluna | Tipo Prisma | Obrigatório no banco | Chaves | Declaração de restrições/default |
|---|---|---|---|---|
| `id` | `String` | Sim | PK | `@id @default(cuid())` |
| `proprietarioId` | `String` | Sim | FK → Usuario.id | — |
| `identificador` | `String` | Sim | UQ | `@unique` |
| `nome` | `String` | Sim | — | — |
| `descricao` | `String` | Sim | — | — |
| `situacao` | `SituacaoSala` | Sim | — | `@default(ATIVA)` |
| `criadaEm` | `DateTime` | Sim | — | `@default(now())` |
| `atualizadaEm` | `DateTime` | Sim | — | `@updatedAt` |

**Navegações do ORM (não são colunas):**

| Campo | Tipo | Multiplicidade acessível a partir desta instância |
|---|---|---|
| `proprietario` | `Usuario` | 1 |
| `membros` | `MembroSala[]` | 0..* |
| `convites` | `ConviteSala[]` | 0..* |
| `solicitacoes` | `SolicitacaoEntradaSala[]` | 0..* |
| `modulos` | `ModuloSala[]` | 0..* |

**Restrições compostas e índices:** `@@index([proprietarioId, situacao])`

### 3.7. MembroSala

Associação antiga de usuário à sala; não é a fonte atual de autorização modular. **Grupo:** Compatibilidade histórica. **Classificação:** Legado persistido. Fonte: prisma/schema.prisma, linha 304.

| Atributo/coluna | Tipo Prisma | Obrigatório no banco | Chaves | Declaração de restrições/default |
|---|---|---|---|---|
| `id` | `String` | Sim | PK | `@id @default(cuid())` |
| `salaId` | `String` | Sim | FK → Sala.id | — |
| `usuarioId` | `String` | Sim | FK → Usuario.id | — |
| `papel` | `PapelMembroSala` | Sim | — | `@default(MEMBRO)` |
| `situacao` | `SituacaoMembroSala` | Sim | — | `@default(ATIVO)` |
| `entrouEm` | `DateTime` | Sim | — | `@default(now())` |
| `encerrouEm` | `DateTime?` | Não (nulável) | — | — |

**Navegações do ORM (não são colunas):**

| Campo | Tipo | Multiplicidade acessível a partir desta instância |
|---|---|---|
| `sala` | `Sala` | 1 |
| `usuario` | `Usuario` | 1 |

**Restrições compostas e índices:** `@@unique([salaId, usuarioId])`; `@@index([usuarioId, situacao])`; `@@index([salaId, situacao])`

### 3.8. ConviteSala

Convite antigo para a sala; preservado, distinto do convite atual por módulo. **Grupo:** Compatibilidade histórica. **Classificação:** Legado persistido. Fonte: prisma/schema.prisma, linha 320.

| Atributo/coluna | Tipo Prisma | Obrigatório no banco | Chaves | Declaração de restrições/default |
|---|---|---|---|---|
| `id` | `String` | Sim | PK | `@id @default(cuid())` |
| `salaId` | `String` | Sim | FK → Sala.id | — |
| `criadoPorId` | `String` | Sim | FK → Usuario.id | — |
| `codigoHash` | `String` | Sim | UQ | `@unique` |
| `expiraEm` | `DateTime` | Sim | — | — |
| `revogadoEm` | `DateTime?` | Não (nulável) | — | — |
| `criadoEm` | `DateTime` | Sim | — | `@default(now())` |

**Navegações do ORM (não são colunas):**

| Campo | Tipo | Multiplicidade acessível a partir desta instância |
|---|---|---|
| `sala` | `Sala` | 1 |
| `criadoPor` | `Usuario` | 1 |
| `solicitacoes` | `SolicitacaoEntradaSala[]` | 0..* |

**Restrições compostas e índices:** `@@index([salaId, revogadoEm, expiraEm])`

### 3.9. SolicitacaoEntradaSala

Registro antigo de solicitação e decisão de ingresso na sala. **Grupo:** Compatibilidade histórica. **Classificação:** Legado persistido. Fonte: prisma/schema.prisma, linha 335.

| Atributo/coluna | Tipo Prisma | Obrigatório no banco | Chaves | Declaração de restrições/default |
|---|---|---|---|---|
| `id` | `String` | Sim | PK | `@id @default(cuid())` |
| `salaId` | `String` | Sim | FK → Sala.id | — |
| `conviteId` | `String` | Sim | FK → ConviteSala.id | — |
| `solicitanteId` | `String` | Sim | FK → Usuario.id | — |
| `situacao` | `SituacaoSolicitacaoSala` | Sim | — | `@default(PENDENTE)` |
| `solicitadaEm` | `DateTime` | Sim | — | `@default(now())` |
| `decididaEm` | `DateTime?` | Não (nulável) | — | — |
| `decididaPorId` | `String?` | Não (nulável) | FK → Usuario.id | — |

**Navegações do ORM (não são colunas):**

| Campo | Tipo | Multiplicidade acessível a partir desta instância |
|---|---|---|
| `sala` | `Sala` | 1 |
| `convite` | `ConviteSala` | 1 |
| `solicitante` | `Usuario` | 1 |
| `decididaPor` | `Usuario?` | 0..1 |

**Restrições compostas e índices:** `@@index([salaId, situacao, solicitadaEm])`; `@@index([solicitanteId, situacao])`

### 3.10. ModuloSala

Contexto coletivo dentro da sala, que agrega instâncias pessoais autorizadas. **Grupo:** Salas e participação modular. **Classificação:** Essencial. Fonte: prisma/schema.prisma, linha 353.

| Atributo/coluna | Tipo Prisma | Obrigatório no banco | Chaves | Declaração de restrições/default |
|---|---|---|---|---|
| `id` | `String` | Sim | PK | `@id @default(cuid())` |
| `salaId` | `String` | Sim | FK → Sala.id | — |
| `titulo` | `String` | Sim | — | — |
| `descricao` | `String` | Sim | — | — |
| `posicao` | `Int` | Sim | — | — |
| `situacao` | `SituacaoModuloSala` | Sim | — | `@default(ATIVO)` |
| `criadoEm` | `DateTime` | Sim | — | `@default(now())` |
| `atualizadoEm` | `DateTime` | Sim | — | `@updatedAt` |

**Navegações do ORM (não são colunas):**

| Campo | Tipo | Multiplicidade acessível a partir desta instância |
|---|---|---|
| `sala` | `Sala` | 1 |
| `vinculos` | `VinculoModuloSala[]` | 0..* |
| `participacoes` | `ParticipacaoModuloSala[]` | 0..* |
| `convites` | `ConviteModuloSala[]` | 0..* |
| `evidenciasHistoricas` | `EvidenciaHistoricaModuloSala[]` | 0..* |

**Restrições compostas e índices:** `@@unique([salaId, posicao])`; `@@index([salaId, situacao])`

### 3.11. ParticipacaoModuloSala

Participação do usuário em um módulo coletivo, com papel e situação; fonte atual de autorização. **Grupo:** Salas e participação modular. **Classificação:** Classe associativa essencial. Fonte: prisma/schema.prisma, linha 372.

| Atributo/coluna | Tipo Prisma | Obrigatório no banco | Chaves | Declaração de restrições/default |
|---|---|---|---|---|
| `id` | `String` | Sim | PK | `@id @default(cuid())` |
| `moduloSalaId` | `String` | Sim | FK → ModuloSala.id | — |
| `usuarioId` | `String` | Sim | FK → Usuario.id | — |
| `papel` | `PapelParticipacaoModuloSala` | Sim | — | `@default(PARTICIPANTE)` |
| `situacao` | `SituacaoParticipacaoModuloSala` | Sim | — | `@default(ATIVA)` |
| `entrouEm` | `DateTime` | Sim | — | `@default(now())` |
| `encerrouEm` | `DateTime?` | Não (nulável) | — | — |

**Navegações do ORM (não são colunas):**

| Campo | Tipo | Multiplicidade acessível a partir desta instância |
|---|---|---|
| `moduloSala` | `ModuloSala` | 1 |
| `usuario` | `Usuario` | 1 |
| `vinculo` | `VinculoModuloSala?` | 0..1 |

**Restrições compostas e índices:** `@@unique([moduloSalaId, usuarioId])`; `@@index([usuarioId, situacao])`; `@@index([moduloSalaId, situacao])`

### 3.12. ConviteModuloSala

Convite por código hash, expiração e revogação para um módulo coletivo específico. **Grupo:** Salas e participação modular. **Classificação:** Essencial para ingresso. Fonte: prisma/schema.prisma, linha 389.

| Atributo/coluna | Tipo Prisma | Obrigatório no banco | Chaves | Declaração de restrições/default |
|---|---|---|---|---|
| `id` | `String` | Sim | PK | `@id @default(cuid())` |
| `moduloSalaId` | `String` | Sim | FK → ModuloSala.id | — |
| `criadoPorId` | `String` | Sim | FK → Usuario.id | — |
| `codigoHash` | `String` | Sim | UQ | `@unique` |
| `expiraEm` | `DateTime` | Sim | — | — |
| `revogadoEm` | `DateTime?` | Não (nulável) | — | — |
| `criadoEm` | `DateTime` | Sim | — | `@default(now())` |

**Navegações do ORM (não são colunas):**

| Campo | Tipo | Multiplicidade acessível a partir desta instância |
|---|---|---|
| `moduloSala` | `ModuloSala` | 1 |
| `criadoPor` | `Usuario` | 1 |

**Restrições compostas e índices:** `@@index([moduloSalaId, revogadoEm, expiraEm])`

### 3.13. VinculoModuloSala

Vincula uma participação e um módulo pessoal ao módulo coletivo, com situação e janela de compartilhamento. **Grupo:** Salas e participação modular. **Classificação:** Classe associativa essencial. Fonte: prisma/schema.prisma, linha 403.

| Atributo/coluna | Tipo Prisma | Obrigatório no banco | Chaves | Declaração de restrições/default |
|---|---|---|---|---|
| `id` | `String` | Sim | PK | `@id @default(cuid())` |
| `moduloSalaId` | `String` | Sim | FK → ModuloSala.id | — |
| `participacaoModuloSalaId` | `String` | Sim | FK → ParticipacaoModuloSala.id; UQ | `@unique` |
| `usuarioId` | `String` | Sim | FK → Usuario.id | — |
| `moduloPessoalId` | `String` | Sim | FK → ModuloAprendizagem.id | — |
| `situacao` | `SituacaoVinculoModuloSala` | Sim | — | `@default(ATIVO)` |
| `compartilharDashboard` | `Boolean` | Sim | — | `@default(true)` |
| `vinculadoEm` | `DateTime` | Sim | — | `@default(now())` |
| `dadosDesde` | `DateTime?` | Não (nulável) | — | — |
| `desvinculadoEm` | `DateTime?` | Não (nulável) | — | — |

**Navegações do ORM (não são colunas):**

| Campo | Tipo | Multiplicidade acessível a partir desta instância |
|---|---|---|
| `moduloSala` | `ModuloSala` | 1 |
| `participacaoModuloSala` | `ParticipacaoModuloSala` | 1 |
| `usuario` | `Usuario` | 1 |
| `moduloPessoal` | `ModuloAprendizagem` | 1 |

**Restrições compostas e índices:** `@@unique([moduloSalaId, usuarioId])`; `@@unique([moduloSalaId, moduloPessoalId])`; `@@index([participacaoModuloSalaId, situacao])`; `@@index([usuarioId, situacao])`; `@@index([moduloPessoalId, situacao])`

### 3.14. EvidenciaHistoricaModuloSala

Resumo pseudonimizado de sessão preservado no contexto coletivo após desligamento; não é evidência percentual de aprendizagem. **Grupo:** Salas e participação modular. **Classificação:** Auxiliar de histórico analítico. Fonte: prisma/schema.prisma, linha 426.

| Atributo/coluna | Tipo Prisma | Obrigatório no banco | Chaves | Declaração de restrições/default |
|---|---|---|---|---|
| `id` | `String` | Sim | PK | `@id @default(cuid())` |
| `moduloSalaId` | `String` | Sim | FK → ModuloSala.id | — |
| `referenciaSessaoHash` | `String` | Sim | UQ | `@unique` |
| `contribuinteAnonimoHash` | `String` | Sim | — | — |
| `encerradaEm` | `DateTime` | Sim | — | — |
| `duracaoMinutos` | `Int` | Sim | — | — |
| `dificuldadePercebida` | `Int?` | Não (nulável) | — | — |
| `compreensaoPercebida` | `Int?` | Não (nulável) | — | — |
| `metodosJson` | `String` | Sim | — | — |
| `formatosJson` | `String` | Sim | — | — |
| `criadaEm` | `DateTime` | Sim | — | `@default(now())` |

**Navegações do ORM (não são colunas):**

| Campo | Tipo | Multiplicidade acessível a partir desta instância |
|---|---|---|
| `moduloSala` | `ModuloSala` | 1 |

**Restrições compostas e índices:** `@@index([moduloSalaId, encerradaEm])`; `@@index([moduloSalaId, contribuinteAnonimoHash])`

### 3.15. PerfilAluno

Perfil antigo de aluno associado à conta e às matrículas; referência opcional em sessões antigas. **Grupo:** Compatibilidade histórica. **Classificação:** Legado persistido. Fonte: prisma/schema.prisma, linha 444.

| Atributo/coluna | Tipo Prisma | Obrigatório no banco | Chaves | Declaração de restrições/default |
|---|---|---|---|---|
| `id` | `String` | Sim | PK | `@id @default(cuid())` |
| `usuarioId` | `String` | Sim | FK → Usuario.id; UQ | `@unique` |
| `pseudonimo` | `String` | Sim | UQ | `@unique` |

**Navegações do ORM (não são colunas):**

| Campo | Tipo | Multiplicidade acessível a partir desta instância |
|---|---|---|
| `usuario` | `Usuario` | 1 |
| `matriculas` | `Matricula[]` | 0..* |
| `sessoesEstudo` | `SessaoEstudo[]` | 0..* |

**Restrições compostas e índices:** nenhum declarado em nível de modelo.

### 3.16. PerfilProfessor

Perfil antigo de professor associado à conta, às turmas e aprovações. **Grupo:** Compatibilidade histórica. **Classificação:** Legado persistido. Fonte: prisma/schema.prisma, linha 453.

| Atributo/coluna | Tipo Prisma | Obrigatório no banco | Chaves | Declaração de restrições/default |
|---|---|---|---|---|
| `id` | `String` | Sim | PK | `@id @default(cuid())` |
| `usuarioId` | `String` | Sim | FK → Usuario.id; UQ | `@unique` |

**Navegações do ORM (não são colunas):**

| Campo | Tipo | Multiplicidade acessível a partir desta instância |
|---|---|---|
| `usuario` | `Usuario` | 1 |
| `turmas` | `Turma[]` | 0..* |
| `aprovacoes` | `AprovacaoRecurso[]` | 0..* |

**Restrições compostas e índices:** nenhum declarado em nível de modelo.

### 3.17. Turma

Turma do modelo anterior, identificada por nome/período e perfil docente. **Grupo:** Compatibilidade histórica. **Classificação:** Legado persistido. Fonte: prisma/schema.prisma, linha 461.

| Atributo/coluna | Tipo Prisma | Obrigatório no banco | Chaves | Declaração de restrições/default |
|---|---|---|---|---|
| `id` | `String` | Sim | PK | `@id @default(cuid())` |
| `nome` | `String` | Sim | — | — |
| `periodo` | `String` | Sim | — | — |
| `professorId` | `String` | Sim | FK → PerfilProfessor.id | — |
| `criadaEm` | `DateTime` | Sim | — | `@default(now())` |

**Navegações do ORM (não são colunas):**

| Campo | Tipo | Multiplicidade acessível a partir desta instância |
|---|---|---|
| `professor` | `PerfilProfessor` | 1 |
| `matriculas` | `Matricula[]` | 0..* |

**Restrições compostas e índices:** `@@unique([nome, periodo])`

### 3.18. Matricula

Associação antiga entre perfil de aluno e turma. **Grupo:** Compatibilidade histórica. **Classificação:** Associativa legada. Fonte: prisma/schema.prisma, linha 473.

| Atributo/coluna | Tipo Prisma | Obrigatório no banco | Chaves | Declaração de restrições/default |
|---|---|---|---|---|
| `id` | `String` | Sim | PK | `@id @default(cuid())` |
| `alunoId` | `String` | Sim | FK → PerfilAluno.id | — |
| `turmaId` | `String` | Sim | FK → Turma.id | — |
| `criadaEm` | `DateTime` | Sim | — | `@default(now())` |

**Navegações do ORM (não são colunas):**

| Campo | Tipo | Multiplicidade acessível a partir desta instância |
|---|---|---|
| `aluno` | `PerfilAluno` | 1 |
| `turma` | `Turma` | 1 |

**Restrições compostas e índices:** `@@unique([alunoId, turmaId])`; `@@index([turmaId])`

### 3.19. RecursoConteudo

Material do módulo, com função educacional, formato, origem, conteúdo/URL opcionais e estado ativo. **Grupo:** Materiais e conceitos. **Classificação:** Essencial. Fonte: prisma/schema.prisma, linha 485.

| Atributo/coluna | Tipo Prisma | Obrigatório no banco | Chaves | Declaração de restrições/default |
|---|---|---|---|---|
| `id` | `String` | Sim | PK | `@id @default(cuid())` |
| `identificador` | `String` | Sim | — | — |
| `titulo` | `String` | Sim | — | — |
| `descricao` | `String` | Sim | — | — |
| `formato` | `FormatoConteudo` | Sim | — | — |
| `minutosEstimados` | `Int` | Sim | — | — |
| `moduloId` | `String` | Sim | FK → ModuloAprendizagem.id | — |
| `conteudoTexto` | `String?` | Não (nulável) | — | — |
| `url` | `String?` | Não (nulável) | — | — |
| `origem` | `OrigemMaterial` | Sim | — | `@default(TEXTO)` |
| `ativo` | `Boolean` | Sim | — | `@default(true)` |
| `criadoEm` | `DateTime` | Sim | — | `@default(now())` |
| `atualizadoEm` | `DateTime` | Sim | — | `@updatedAt` |
| `funcao` | `FuncaoMaterial` | Sim | — | `@default(REFERENCIA)` |
| `dataEvento` | `DateTime?` | Não (nulável) | — | — |
| `dataEventoConfirmada` | `Boolean` | Sim | — | `@default(false)` |

**Navegações do ORM (não são colunas):**

| Campo | Tipo | Multiplicidade acessível a partir desta instância |
|---|---|---|
| `modulo` | `ModuloAprendizagem` | 1 |
| `aprovacoes` | `AprovacaoRecurso[]` | 0..* |
| `vinculosSessoes` | `MaterialSessaoEstudo[]` | 0..* |
| `arquivo` | `ArquivoMaterial?` | 0..1 |
| `analise` | `AnaliseMaterial?` | 0..1 |
| `conceitos` | `ConceitoMaterial[]` | 0..* |
| `evidencia` | `EvidenciaAprendizagem?` | 0..1 |

**Restrições compostas e índices:** `@@unique([moduloId, identificador])`; `@@index([moduloId, formato])`; `@@index([moduloId, origem, ativo])`

### 3.20. AnaliseMaterial

Estado e resultado persistido da análise de conteúdo do material, com resumo, coleções serializadas e proveniência. **Grupo:** IA e materiais. **Classificação:** Essencial se representar análise de materiais. Fonte: prisma/schema.prisma, linha 516.

| Atributo/coluna | Tipo Prisma | Obrigatório no banco | Chaves | Declaração de restrições/default |
|---|---|---|---|---|
| `id` | `String` | Sim | PK | `@id @default(cuid())` |
| `recursoId` | `String` | Sim | FK → RecursoConteudo.id; UQ | `@unique` |
| `situacao` | `SituacaoAnaliseMaterial` | Sim | — | `@default(PENDENTE)` |
| `versao` | `String` | Sim | — | `@default("analise-material-v1")` |
| `resumo` | `String?` | Não (nulável) | — | — |
| `conceitosJson` | `String` | Sim | — | `@default("[]")` |
| `pontosRevisaoJson` | `String` | Sim | — | `@default("[]")` |
| `metodosSugeridosJson` | `String` | Sim | — | `@default("[]")` |
| `proximasSessoesJson` | `String` | Sim | — | `@default("[]")` |
| `perguntasReflexaoJson` | `String` | Sim | — | `@default("[]")` |
| `trechosConceitosJson` | `String` | Sim | — | `@default("[]")` |
| `afirmacoesJson` | `String` | Sim | — | `@default("[]")` |
| `interpretacaoVisualJson` | `String` | Sim | — | `@default("[]")` |
| `origem` | `String?` | Não (nulável) | — | — |
| `modelo` | `String?` | Não (nulável) | — | — |
| `caracteresExtraidos` | `Int` | Sim | — | `@default(0)` |
| `conteudoTruncado` | `Boolean` | Sim | — | `@default(false)` |
| `tentativas` | `Int` | Sim | — | `@default(0)` |
| `codigoFalha` | `String?` | Não (nulável) | — | — |
| `hashConteudo` | `String?` | Não (nulável) | — | — |
| `analisadaEm` | `DateTime?` | Não (nulável) | — | — |
| `criadaEm` | `DateTime` | Sim | — | `@default(now())` |
| `atualizadaEm` | `DateTime` | Sim | — | `@updatedAt` |

**Navegações do ORM (não são colunas):**

| Campo | Tipo | Multiplicidade acessível a partir desta instância |
|---|---|---|
| `recurso` | `RecursoConteudo` | 1 |

**Restrições compostas e índices:** `@@index([situacao, atualizadaEm])`

### 3.21. ArquivoMaterial

Metadados e chave de armazenamento do arquivo vinculado ao material. **Grupo:** Materiais e conceitos. **Classificação:** Auxiliar técnico. Fonte: prisma/schema.prisma, linha 545.

| Atributo/coluna | Tipo Prisma | Obrigatório no banco | Chaves | Declaração de restrições/default |
|---|---|---|---|---|
| `id` | `String` | Sim | PK | `@id @default(cuid())` |
| `recursoId` | `String` | Sim | FK → RecursoConteudo.id; UQ | `@unique` |
| `nomeOriginal` | `String` | Sim | — | — |
| `tipoMime` | `String` | Sim | — | — |
| `tamanhoBytes` | `Int` | Sim | — | — |
| `chaveArmazenamento` | `String` | Sim | UQ | `@unique` |
| `extensaoNormalizada` | `String` | Sim | — | — |
| `criadoEm` | `DateTime` | Sim | — | `@default(now())` |

**Navegações do ORM (não são colunas):**

| Campo | Tipo | Multiplicidade acessível a partir desta instância |
|---|---|---|
| `recurso` | `RecursoConteudo` | 1 |

**Restrições compostas e índices:** `@@index([recursoId])`

### 3.22. AprovacaoRecurso

Associação antiga de aprovação de recurso por perfil de professor, com situação e observação. **Grupo:** Compatibilidade histórica. **Classificação:** Associativa legada. Fonte: prisma/schema.prisma, linha 559.

| Atributo/coluna | Tipo Prisma | Obrigatório no banco | Chaves | Declaração de restrições/default |
|---|---|---|---|---|
| `id` | `String` | Sim | PK | `@id @default(cuid())` |
| `recursoId` | `String` | Sim | FK → RecursoConteudo.id | — |
| `professorId` | `String` | Sim | FK → PerfilProfessor.id | — |
| `situacao` | `SituacaoAprovacao` | Sim | — | `@default(PENDENTE)` |
| `observacao` | `String?` | Não (nulável) | — | — |
| `criadaEm` | `DateTime` | Sim | — | `@default(now())` |
| `atualizadaEm` | `DateTime` | Sim | — | `@updatedAt` |

**Navegações do ORM (não são colunas):**

| Campo | Tipo | Multiplicidade acessível a partir desta instância |
|---|---|---|
| `recurso` | `RecursoConteudo` | 1 |
| `professor` | `PerfilProfessor` | 1 |

**Restrições compostas e índices:** `@@unique([recursoId, professorId])`; `@@index([recursoId, situacao])`

### 3.23. SessaoEstudo

Registro de episódio de estudo com conta, módulo, intervalo, estado, percepções e contexto. **Grupo:** Sessões e estratégias. **Classificação:** Essencial. Fonte: prisma/schema.prisma, linha 574.

| Atributo/coluna | Tipo Prisma | Obrigatório no banco | Chaves | Declaração de restrições/default |
|---|---|---|---|---|
| `id` | `String` | Sim | PK | `@id @default(cuid())` |
| `usuarioId` | `String` | Sim | FK → Usuario.id | — |
| `moduloId` | `String` | Sim | FK → ModuloAprendizagem.id | — |
| `alunoId` | `String?` | Não (nulável) | FK → PerfilAluno.id | — |
| `descricao` | `String` | Sim | — | `@default("")` |
| `modoRegistro` | `ModoRegistroSessao` | Sim | — | `@default(CRONOMETRO)` |
| `dificuldadePercebida` | `Int?` | Não (nulável) | — | — |
| `compreensaoPercebida` | `Int?` | Não (nulável) | — | — |
| `observacao` | `String?` | Não (nulável) | — | — |
| `desafioId` | `String?` | Não (nulável) | FK → DesafioExperimentacao.id | — |
| `iniciadaEm` | `DateTime` | Sim | — | — |
| `encerradaEm` | `DateTime?` | Não (nulável) | — | — |
| `duracaoMinutos` | `Int?` | Não (nulável) | — | — |
| `situacao` | `SituacaoSessao` | Sim | — | `@default(ATIVA)` |
| `arquivada` | `Boolean` | Sim | — | `@default(false)` |
| `criadaEm` | `DateTime` | Sim | — | `@default(now())` |
| `atualizadaEm` | `DateTime` | Sim | — | `@default(now()) @updatedAt` |

**Navegações do ORM (não são colunas):**

| Campo | Tipo | Multiplicidade acessível a partir desta instância |
|---|---|---|
| `usuario` | `Usuario` | 1 |
| `modulo` | `ModuloAprendizagem` | 1 |
| `aluno` | `PerfilAluno?` | 0..1 |
| `desafio` | `DesafioExperimentacao?` | 0..1 |
| `metodos` | `MetodoSessaoEstudo[]` | 0..* |
| `formatos` | `FormatoSessaoEstudo[]` | 0..* |
| `materiais` | `MaterialSessaoEstudo[]` | 0..* |
| `conceitos` | `ConceitoSessao[]` | 0..* |
| `vinculosEvidencias` | `VinculoEvidenciaSessao[]` | 0..* |

**Restrições compostas e índices:** `@@index([usuarioId, moduloId, situacao])`; `@@index([alunoId, situacao])`; `@@index([usuarioId, desafioId, situacao])`; `@@index([usuarioId, moduloId, situacao, iniciadaEm])`; `@@index([usuarioId, arquivada, situacao])`

### 3.24. MetodoSessaoEstudo

Armazena cada valor do enum MetodoEstudo selecionado na sessão; não referencia tabela de métodos. **Grupo:** Sessões e estratégias. **Classificação:** Associativa técnica simplificável. Fonte: prisma/schema.prisma, linha 611.

| Atributo/coluna | Tipo Prisma | Obrigatório no banco | Chaves | Declaração de restrições/default |
|---|---|---|---|---|
| `sessaoId` | `String` | Sim | PK composta; FK → SessaoEstudo.id | — |
| `metodo` | `MetodoEstudo` | Sim | PK composta | — |

**Navegações do ORM (não são colunas):**

| Campo | Tipo | Multiplicidade acessível a partir desta instância |
|---|---|---|
| `sessao` | `SessaoEstudo` | 1 |

**Restrições compostas e índices:** `@@id([sessaoId, metodo])`; `@@index([metodo])`

### 3.25. FormatoSessaoEstudo

Armazena cada valor do enum FormatoConteudo selecionado na sessão; não referencia tabela de formatos. **Grupo:** Sessões e estratégias. **Classificação:** Associativa técnica simplificável. Fonte: prisma/schema.prisma, linha 620.

| Atributo/coluna | Tipo Prisma | Obrigatório no banco | Chaves | Declaração de restrições/default |
|---|---|---|---|---|
| `sessaoId` | `String` | Sim | PK composta; FK → SessaoEstudo.id | — |
| `formato` | `FormatoConteudo` | Sim | PK composta | — |

**Navegações do ORM (não são colunas):**

| Campo | Tipo | Multiplicidade acessível a partir desta instância |
|---|---|---|
| `sessao` | `SessaoEstudo` | 1 |

**Restrições compostas e índices:** `@@id([sessaoId, formato])`; `@@index([formato])`

### 3.26. MaterialSessaoEstudo

Associação muitos-para-muitos entre sessão e material utilizado. **Grupo:** Sessões e estratégias. **Classificação:** Associativa simplificável. Fonte: prisma/schema.prisma, linha 629.

| Atributo/coluna | Tipo Prisma | Obrigatório no banco | Chaves | Declaração de restrições/default |
|---|---|---|---|---|
| `sessaoId` | `String` | Sim | PK composta; FK → SessaoEstudo.id | — |
| `recursoId` | `String` | Sim | PK composta; FK → RecursoConteudo.id | — |

**Navegações do ORM (não são colunas):**

| Campo | Tipo | Multiplicidade acessível a partir desta instância |
|---|---|---|
| `sessao` | `SessaoEstudo` | 1 |
| `recurso` | `RecursoConteudo` | 1 |

**Restrições compostas e índices:** `@@id([sessaoId, recursoId])`; `@@index([recursoId])`

### 3.27. ConceitoAprendizagem

Conceito canônico contextualizado ao módulo, com chave normalizada, aliases e origem. **Grupo:** Materiais e conceitos. **Classificação:** Essencial. Fonte: prisma/schema.prisma, linha 639.

| Atributo/coluna | Tipo Prisma | Obrigatório no banco | Chaves | Declaração de restrições/default |
|---|---|---|---|---|
| `id` | `String` | Sim | PK | `@id @default(cuid())` |
| `moduloId` | `String` | Sim | FK → ModuloAprendizagem.id | — |
| `nome` | `String` | Sim | — | — |
| `chave` | `String` | Sim | — | — |
| `aliasesJson` | `String` | Sim | — | `@default("[]")` |
| `origem` | `String` | Sim | — | `@default("ANALISE_MATERIAL")` |
| `ativo` | `Boolean` | Sim | — | `@default(true)` |
| `criadoEm` | `DateTime` | Sim | — | `@default(now())` |
| `atualizadoEm` | `DateTime` | Sim | — | `@updatedAt` |

**Navegações do ORM (não são colunas):**

| Campo | Tipo | Multiplicidade acessível a partir desta instância |
|---|---|---|
| `modulo` | `ModuloAprendizagem` | 1 |
| `materiais` | `ConceitoMaterial[]` | 0..* |
| `sessoes` | `ConceitoSessao[]` | 0..* |
| `evidencias` | `ConceitoEvidencia[]` | 0..* |
| `questoes` | `ConceitoQuestaoEvidencia[]` | 0..* |

**Restrições compostas e índices:** `@@unique([moduloId, chave])`; `@@index([moduloId, ativo])`

### 3.28. ConceitoMaterial

Associa conceito e material, conservando trechos de suporte em JSON textual. **Grupo:** Materiais e conceitos. **Classificação:** Classe associativa com atributo próprio. Fonte: prisma/schema.prisma, linha 659.

| Atributo/coluna | Tipo Prisma | Obrigatório no banco | Chaves | Declaração de restrições/default |
|---|---|---|---|---|
| `conceitoId` | `String` | Sim | PK composta; FK → ConceitoAprendizagem.id | — |
| `recursoId` | `String` | Sim | PK composta; FK → RecursoConteudo.id | — |
| `trechosJson` | `String` | Sim | — | `@default("[]")` |

**Navegações do ORM (não são colunas):**

| Campo | Tipo | Multiplicidade acessível a partir desta instância |
|---|---|---|
| `conceito` | `ConceitoAprendizagem` | 1 |
| `recurso` | `RecursoConteudo` | 1 |

**Restrições compostas e índices:** `@@id([conceitoId, recursoId])`; `@@index([recursoId])`

### 3.29. ConceitoSessao

Associação explícita entre conceito e sessão. **Grupo:** Sessões e estratégias. **Classificação:** Associativa simplificável. Fonte: prisma/schema.prisma, linha 670.

| Atributo/coluna | Tipo Prisma | Obrigatório no banco | Chaves | Declaração de restrições/default |
|---|---|---|---|---|
| `conceitoId` | `String` | Sim | PK composta; FK → ConceitoAprendizagem.id | — |
| `sessaoId` | `String` | Sim | PK composta; FK → SessaoEstudo.id | — |

**Navegações do ORM (não são colunas):**

| Campo | Tipo | Multiplicidade acessível a partir desta instância |
|---|---|---|
| `conceito` | `ConceitoAprendizagem` | 1 |
| `sessao` | `SessaoEstudo` | 1 |

**Restrições compostas e índices:** `@@id([conceitoId, sessaoId])`; `@@index([sessaoId])`

### 3.30. EvidenciaAprendizagem

Resultado de atividade contextualizado ao módulo, com tipo, data e desempenho percentual opcional. **Grupo:** Evidências de aprendizagem. **Classificação:** Essencial. Fonte: prisma/schema.prisma, linha 680.

| Atributo/coluna | Tipo Prisma | Obrigatório no banco | Chaves | Declaração de restrições/default |
|---|---|---|---|---|
| `id` | `String` | Sim | PK | `@id @default(cuid())` |
| `moduloId` | `String` | Sim | FK → ModuloAprendizagem.id | — |
| `recursoId` | `String?` | Não (nulável) | FK → RecursoConteudo.id; UQ | `@unique` |
| `titulo` | `String` | Sim | — | — |
| `tipo` | `TipoEvidenciaAprendizagem` | Sim | — | — |
| `dataEvento` | `DateTime` | Sim | — | — |
| `situacaoConfirmacao` | `SituacaoConfirmacao` | Sim | — | `@default(PENDENTE)` |
| `desempenhoPercentual` | `Float?` | Não (nulável) | — | — |
| `resumo` | `String?` | Não (nulável) | — | — |
| `dadosOrigemJson` | `String` | Sim | — | `@default("{}")` |
| `confirmadaEm` | `DateTime?` | Não (nulável) | — | — |
| `criadaEm` | `DateTime` | Sim | — | `@default(now())` |
| `atualizadaEm` | `DateTime` | Sim | — | `@updatedAt` |

**Navegações do ORM (não são colunas):**

| Campo | Tipo | Multiplicidade acessível a partir desta instância |
|---|---|---|
| `modulo` | `ModuloAprendizagem` | 1 |
| `recurso` | `RecursoConteudo?` | 0..1 |
| `questoes` | `QuestaoEvidencia[]` | 0..* |
| `conceitos` | `ConceitoEvidencia[]` | 0..* |
| `vinculosSessoes` | `VinculoEvidenciaSessao[]` | 0..* |

**Restrições compostas e índices:** `@@index([moduloId, dataEvento])`; `@@index([moduloId, situacaoConfirmacao])`

### 3.31. QuestaoEvidencia

Questão identificada dentro de uma evidência, com tipo, resultado e pontuações opcionais. **Grupo:** Evidências de aprendizagem. **Classificação:** Detalhamento relevante. Fonte: prisma/schema.prisma, linha 705.

| Atributo/coluna | Tipo Prisma | Obrigatório no banco | Chaves | Declaração de restrições/default |
|---|---|---|---|---|
| `id` | `String` | Sim | PK | `@id @default(cuid())` |
| `evidenciaId` | `String` | Sim | FK → EvidenciaAprendizagem.id | — |
| `identificador` | `String` | Sim | — | — |
| `resumo` | `String` | Sim | — | — |
| `tipo` | `TipoQuestaoEvidencia` | Sim | — | `@default(OUTRA)` |
| `resultado` | `ResultadoQuestaoEvidencia` | Sim | — | `@default(NAO_INFORMADO)` |
| `pontuacaoObtida` | `Float?` | Não (nulável) | — | — |
| `pontuacaoMaxima` | `Float?` | Não (nulável) | — | — |

**Navegações do ORM (não são colunas):**

| Campo | Tipo | Multiplicidade acessível a partir desta instância |
|---|---|---|
| `evidencia` | `EvidenciaAprendizagem` | 1 |
| `conceitos` | `ConceitoQuestaoEvidencia[]` | 0..* |

**Restrições compostas e índices:** `@@unique([evidenciaId, identificador])`; `@@index([evidenciaId])`

### 3.32. ConceitoEvidencia

Associação entre conceito e evidência. **Grupo:** Evidências de aprendizagem. **Classificação:** Associativa simplificável. Fonte: prisma/schema.prisma, linha 721.

| Atributo/coluna | Tipo Prisma | Obrigatório no banco | Chaves | Declaração de restrições/default |
|---|---|---|---|---|
| `conceitoId` | `String` | Sim | PK composta; FK → ConceitoAprendizagem.id | — |
| `evidenciaId` | `String` | Sim | PK composta; FK → EvidenciaAprendizagem.id | — |

**Navegações do ORM (não são colunas):**

| Campo | Tipo | Multiplicidade acessível a partir desta instância |
|---|---|---|
| `conceito` | `ConceitoAprendizagem` | 1 |
| `evidencia` | `EvidenciaAprendizagem` | 1 |

**Restrições compostas e índices:** `@@id([conceitoId, evidenciaId])`; `@@index([evidenciaId])`

### 3.33. ConceitoQuestaoEvidencia

Associação entre conceito e questão de evidência. **Grupo:** Evidências de aprendizagem. **Classificação:** Associativa simplificável. Fonte: prisma/schema.prisma, linha 731.

| Atributo/coluna | Tipo Prisma | Obrigatório no banco | Chaves | Declaração de restrições/default |
|---|---|---|---|---|
| `conceitoId` | `String` | Sim | PK composta; FK → ConceitoAprendizagem.id | — |
| `questaoId` | `String` | Sim | PK composta; FK → QuestaoEvidencia.id | — |

**Navegações do ORM (não são colunas):**

| Campo | Tipo | Multiplicidade acessível a partir desta instância |
|---|---|---|
| `conceito` | `ConceitoAprendizagem` | 1 |
| `questao` | `QuestaoEvidencia` | 1 |

**Restrições compostas e índices:** `@@id([conceitoId, questaoId])`; `@@index([questaoId])`

### 3.34. VinculoEvidenciaSessao

Associação explícita entre evidência e sessão, com origem do vínculo e metadado histórico de confirmação. **Grupo:** Evidências de aprendizagem. **Classificação:** Classe associativa relevante. Fonte: prisma/schema.prisma, linha 741.

| Atributo/coluna | Tipo Prisma | Obrigatório no banco | Chaves | Declaração de restrições/default |
|---|---|---|---|---|
| `evidenciaId` | `String` | Sim | PK composta; FK → EvidenciaAprendizagem.id | — |
| `sessaoId` | `String` | Sim | PK composta; FK → SessaoEstudo.id | — |
| `origem` | `OrigemVinculoEvidenciaSessao` | Sim | — | `@default(MANUAL)` |
| `confirmado` | `Boolean` | Sim | — | `@default(true)` |

**Navegações do ORM (não são colunas):**

| Campo | Tipo | Multiplicidade acessível a partir desta instância |
|---|---|---|
| `evidencia` | `EvidenciaAprendizagem` | 1 |
| `sessao` | `SessaoEstudo` | 1 |

**Restrições compostas e índices:** `@@id([evidenciaId, sessaoId])`; `@@index([sessaoId])`

### 3.35. DesafioExperimentacao

Contexto de experimentação de método associado à conta e ao módulo; sessões podem referenciá-lo. **Grupo:** Sessões e estratégias. **Classificação:** Auxiliar de domínio; serviços preservados. Fonte: prisma/schema.prisma, linha 754.

| Atributo/coluna | Tipo Prisma | Obrigatório no banco | Chaves | Declaração de restrições/default |
|---|---|---|---|---|
| `id` | `String` | Sim | PK | `@id @default(cuid())` |
| `usuarioId` | `String` | Sim | FK → Usuario.id | — |
| `moduloId` | `String` | Sim | FK → ModuloAprendizagem.id | — |
| `metodo` | `MetodoEstudo` | Sim | — | — |
| `meta` | `String` | Sim | — | — |
| `situacao` | `SituacaoDesafioExperimentacao` | Sim | — | `@default(ATIVO)` |
| `criadoEm` | `DateTime` | Sim | — | `@default(now())` |
| `canceladoEm` | `DateTime?` | Não (nulável) | — | — |

**Navegações do ORM (não são colunas):**

| Campo | Tipo | Multiplicidade acessível a partir desta instância |
|---|---|---|
| `usuario` | `Usuario` | 1 |
| `modulo` | `ModuloAprendizagem` | 1 |
| `sessoes` | `SessaoEstudo[]` | 0..* |

**Restrições compostas e índices:** `@@index([usuarioId, moduloId, situacao])`; `@@index([moduloId, metodo, situacao])`

### 3.36. EventoAuditoria

Registro técnico de ação, alvo textual, metadados e ator opcional. **Grupo:** IA e infraestrutura. **Classificação:** Técnico de infraestrutura. Fonte: prisma/schema.prisma, linha 771.

| Atributo/coluna | Tipo Prisma | Obrigatório no banco | Chaves | Declaração de restrições/default |
|---|---|---|---|---|
| `id` | `String` | Sim | PK | `@id @default(cuid())` |
| `atorId` | `String?` | Não (nulável) | FK → Usuario.id | — |
| `acao` | `String` | Sim | — | — |
| `alvo` | `String` | Sim | — | — |
| `metadados` | `String?` | Não (nulável) | — | — |
| `criadoEm` | `DateTime` | Sim | — | `@default(now())` |

**Navegações do ORM (não são colunas):**

| Campo | Tipo | Multiplicidade acessível a partir desta instância |
|---|---|---|
| `ator` | `Usuario?` | 0..1 |

**Restrições compostas e índices:** `@@index([atorId, criadoEm])`

## 4. Enumerações existentes

| Enumeração | Valores exatos | Modelos/campos que a utilizam |
|---|---|---|
| `PapelUsuario` | `ALUNO`, `PROFESSOR`, `ADMINISTRADOR` | `Usuario.papel` |
| `FormatoConteudo` | `VIDEO`, `PDF`, `TEXTO`, `IMAGEM`, `DOCUMENTO`, `PLANILHA`, `AUDIO`, `MAPA_MENTAL`, `PODCAST`, `QUIZ`, `EXERCICIO_PRATICO` | `RecursoConteudo.formato`; `FormatoSessaoEstudo.formato` |
| `OrigemMaterial` | `TEXTO`, `LINK`, `ARQUIVO` | `RecursoConteudo.origem` |
| `SituacaoAprovacao` | `PENDENTE`, `APROVADO`, `REJEITADO` | `AprovacaoRecurso.situacao` |
| `SituacaoSessao` | `PLANEJADA`, `ATIVA`, `CONCLUIDA`, `ABANDONADA`, `INVALIDADA` | `SessaoEstudo.situacao` |
| `ModoRegistroSessao` | `MANUAL`, `CRONOMETRO` | `SessaoEstudo.modoRegistro` |
| `SituacaoSala` | `ATIVA`, `ARQUIVADA`, `EXCLUIDA` | `Sala.situacao` |
| `PapelMembroSala` | `PROPRIETARIO`, `MEMBRO` | `MembroSala.papel` |
| `SituacaoMembroSala` | `ATIVO`, `SAIU`, `REMOVIDO` | `MembroSala.situacao` |
| `SituacaoSolicitacaoSala` | `PENDENTE`, `APROVADA`, `REJEITADA`, `CANCELADA` | `SolicitacaoEntradaSala.situacao` |
| `SituacaoModuloSala` | `ATIVO`, `ARQUIVADO` | `ModuloSala.situacao` |
| `SituacaoVinculoModuloSala` | `ATIVO`, `DESVINCULADO` | `VinculoModuloSala.situacao` |
| `PapelParticipacaoModuloSala` | `ADMINISTRADOR`, `PARTICIPANTE` | `ParticipacaoModuloSala.papel` |
| `SituacaoParticipacaoModuloSala` | `ATIVA`, `SAIU`, `REMOVIDA` | `ParticipacaoModuloSala.situacao` |
| `MetodoEstudo` | `FEYNMAN`, `RECUPERACAO_ATIVA`, `REPETICAO_ESPACADA`, `POMODORO`, `INTERCALAMENTO`, `PRATICA_DISTRIBUIDA`, `LEITURA_ATIVA`, `VIDEO_GUIADO`, `RESUMO`, `EXERCICIO`, `REVISAO`, `OUTRO` | `MetodoSessaoEstudo.metodo`; `DesafioExperimentacao.metodo` |
| `SituacaoDesafioExperimentacao` | `ATIVO`, `CANCELADO` | `DesafioExperimentacao.situacao` |
| `ProvedorIa` | `GROQ`, `GEMINI`, `QWEN` | `ConfiguracaoIa.provedor` |
| `EstadoConfiguracaoIa` | `NAO_TESTADA`, `FUNCIONANDO`, `AUTENTICACAO_INVALIDA`, `LIMITADA`, `INDISPONIVEL` | `ConfiguracaoIa.estadoUltimoTeste` |
| `SituacaoAnaliseMaterial` | `PENDENTE`, `PROCESSANDO`, `CONCLUIDA`, `FALHA`, `NAO_SUPORTADA` | `AnaliseMaterial.situacao` |
| `FuncaoMaterial` | `REFERENCIA`, `AVALIACAO`, `ANOTACAO`, `EVIDENCIA_VISUAL` | `RecursoConteudo.funcao` |
| `SituacaoConfirmacao` | `PENDENTE`, `CONFIRMADA`, `REJEITADA` | `EvidenciaAprendizagem.situacaoConfirmacao` |
| `TipoEvidenciaAprendizagem` | `PROVA`, `EXERCICIO`, `AVALIACAO`, `OUTRA` | `EvidenciaAprendizagem.tipo` |
| `TipoQuestaoEvidencia` | `MULTIPLA_ESCOLHA`, `VERDADEIRO_FALSO`, `DISCURSIVA`, `PRATICA`, `APLICACAO`, `OUTRA` | `QuestaoEvidencia.tipo` |
| `ResultadoQuestaoEvidencia` | `ACERTO`, `PARCIAL`, `ERRO`, `NAO_INFORMADO` | `QuestaoEvidencia.resultado` |
| `OrigemVinculoEvidenciaSessao` | `MANUAL`, `INFERIDO` | `VinculoEvidenciaSessao.origem` |

**Uso vigente versus capacidade de armazenamento.** MetodoEstudo preserva valores históricos, mas src/dominio/sessoes/metodos.ts disponibiliza para novos registros FEYNMAN, RECUPERACAO_ATIVA, REPETICAO_ESPACADA, POMODORO, INTERCALAMENTO e PRATICA_DISTRIBUIDA. ProvedorIa conserva GROQ/GEMINI/QWEN, enquanto o catálogo atual em src/servidor/ia/catalogo-provedores.ts oferece apenas GROQ. PapelUsuario é explicitamente técnico/legado; não fundamenta uma generalização UML entre aluno, professor e administrador no produto atual. Os papéis de participação modular e a permissão administradorIa são conceitos distintos.

SituacaoConfirmacao e os campos de confirmação preservados no schema são compatibilidade histórica; não devem aparecer no diagrama principal como fluxo obrigatório de aprovação de evidências. FuncaoMaterial e TipoEvidenciaAprendizagem são enums diferentes: ANOTACAO/EVIDENCIA_VISUAL são funções de material, enquanto os tipos de evidência são PROVA/EXERCICIO/AVALIACAO/OUTRA.

## 5. Relacionamentos completos e cardinalidades

### 5.1 Relações físicas com FK

**Leitura das colunas:** origem é o registro que contém a FK. “Destino por origem” responde quantos pais uma origem referencia; “Origens por destino” responde quantos registros de origem um destino pode ter. 0..1 inverso resulta de FK única; FK opcional permite origem sem destino. Todas as referências abaixo apontam para id. Não existem relações N:N implícitas no schema: as associações entre modelos são explicitadas por modelos intermediários.

| Origem → destino | Campo de navegação / nome explícito da relação | FK → referência | Destino por origem | Origens por destino | Tipo resumido | onDelete |
|---|---|---|---|---|---|---|
| `ConfiguracaoIa` → `Usuario` | `usuario` / sem nome explícito | `usuarioId` → `id` | 1 | 0..* | N:1 | Cascade |
| `ModuloAprendizagem` → `Usuario` | `usuario` / sem nome explícito | `usuarioId` → `id` | 1 | 0..* | N:1 | Cascade |
| `CompartilhamentoModulo` → `ModuloAprendizagem` | `modulo` / sem nome explícito | `moduloId` → `id` | 1 | 0..1 | 1:1 opcional no inverso | Cascade |
| `AcessoModuloCompartilhado` → `ModuloAprendizagem` | `modulo` / sem nome explícito | `moduloId` → `id` | 1 | 0..* | N:1 | Cascade |
| `AcessoModuloCompartilhado` → `Usuario` | `convidado` / sem nome explícito | `convidadoId` → `id` | 1 | 0..* | N:1 | Cascade |
| `Sala` → `Usuario` | `proprietario` / `ProprietarioSala` | `proprietarioId` → `id` | 1 | 0..* | N:1 | Restrict |
| `MembroSala` → `Sala` | `sala` / sem nome explícito | `salaId` → `id` | 1 | 0..* | N:1 | Cascade |
| `MembroSala` → `Usuario` | `usuario` / sem nome explícito | `usuarioId` → `id` | 1 | 0..* | N:1 | Restrict |
| `ConviteSala` → `Sala` | `sala` / sem nome explícito | `salaId` → `id` | 1 | 0..* | N:1 | Cascade |
| `ConviteSala` → `Usuario` | `criadoPor` / `CriadorConviteSala` | `criadoPorId` → `id` | 1 | 0..* | N:1 | Restrict |
| `SolicitacaoEntradaSala` → `Sala` | `sala` / sem nome explícito | `salaId` → `id` | 1 | 0..* | N:1 | Cascade |
| `SolicitacaoEntradaSala` → `ConviteSala` | `convite` / sem nome explícito | `conviteId` → `id` | 1 | 0..* | N:1 | Restrict |
| `SolicitacaoEntradaSala` → `Usuario` | `solicitante` / `SolicitanteSala` | `solicitanteId` → `id` | 1 | 0..* | N:1 | Restrict |
| `SolicitacaoEntradaSala` → `Usuario` | `decididaPor` / `DecisorSolicitacaoSala` | `decididaPorId` → `id` | 0..1 | 0..* | N:1 | SetNull |
| `ModuloSala` → `Sala` | `sala` / sem nome explícito | `salaId` → `id` | 1 | 0..* | N:1 | Cascade |
| `ParticipacaoModuloSala` → `ModuloSala` | `moduloSala` / sem nome explícito | `moduloSalaId` → `id` | 1 | 0..* | N:1 | Cascade |
| `ParticipacaoModuloSala` → `Usuario` | `usuario` / sem nome explícito | `usuarioId` → `id` | 1 | 0..* | N:1 | Restrict |
| `ConviteModuloSala` → `ModuloSala` | `moduloSala` / sem nome explícito | `moduloSalaId` → `id` | 1 | 0..* | N:1 | Cascade |
| `ConviteModuloSala` → `Usuario` | `criadoPor` / `CriadorConviteModuloSala` | `criadoPorId` → `id` | 1 | 0..* | N:1 | Restrict |
| `VinculoModuloSala` → `ModuloSala` | `moduloSala` / sem nome explícito | `moduloSalaId` → `id` | 1 | 0..* | N:1 | Cascade |
| `VinculoModuloSala` → `ParticipacaoModuloSala` | `participacaoModuloSala` / sem nome explícito | `participacaoModuloSalaId` → `id` | 1 | 0..1 | 1:1 opcional no inverso | Cascade |
| `VinculoModuloSala` → `Usuario` | `usuario` / sem nome explícito | `usuarioId` → `id` | 1 | 0..* | N:1 | Restrict |
| `VinculoModuloSala` → `ModuloAprendizagem` | `moduloPessoal` / sem nome explícito | `moduloPessoalId` → `id` | 1 | 0..* | N:1 | Restrict |
| `EvidenciaHistoricaModuloSala` → `ModuloSala` | `moduloSala` / sem nome explícito | `moduloSalaId` → `id` | 1 | 0..* | N:1 | Cascade |
| `PerfilAluno` → `Usuario` | `usuario` / sem nome explícito | `usuarioId` → `id` | 1 | 0..1 | 1:1 opcional no inverso | Cascade |
| `PerfilProfessor` → `Usuario` | `usuario` / sem nome explícito | `usuarioId` → `id` | 1 | 0..1 | 1:1 opcional no inverso | Cascade |
| `Turma` → `PerfilProfessor` | `professor` / sem nome explícito | `professorId` → `id` | 1 | 0..* | N:1 | Restrict |
| `Matricula` → `PerfilAluno` | `aluno` / sem nome explícito | `alunoId` → `id` | 1 | 0..* | N:1 | Cascade |
| `Matricula` → `Turma` | `turma` / sem nome explícito | `turmaId` → `id` | 1 | 0..* | N:1 | Cascade |
| `RecursoConteudo` → `ModuloAprendizagem` | `modulo` / sem nome explícito | `moduloId` → `id` | 1 | 0..* | N:1 | Cascade |
| `AnaliseMaterial` → `RecursoConteudo` | `recurso` / sem nome explícito | `recursoId` → `id` | 1 | 0..1 | 1:1 opcional no inverso | Cascade |
| `ArquivoMaterial` → `RecursoConteudo` | `recurso` / sem nome explícito | `recursoId` → `id` | 1 | 0..1 | 1:1 opcional no inverso | Cascade |
| `AprovacaoRecurso` → `RecursoConteudo` | `recurso` / sem nome explícito | `recursoId` → `id` | 1 | 0..* | N:1 | Cascade |
| `AprovacaoRecurso` → `PerfilProfessor` | `professor` / sem nome explícito | `professorId` → `id` | 1 | 0..* | N:1 | Cascade |
| `SessaoEstudo` → `Usuario` | `usuario` / `SessoesDoUsuario` | `usuarioId` → `id` | 1 | 0..* | N:1 | Cascade |
| `SessaoEstudo` → `ModuloAprendizagem` | `modulo` / `SessoesDoModulo` | `moduloId` → `id` | 1 | 0..* | N:1 | Cascade |
| `SessaoEstudo` → `PerfilAluno` | `aluno` / sem nome explícito | `alunoId` → `id` | 0..1 | 0..* | N:1 | SetNull |
| `SessaoEstudo` → `DesafioExperimentacao` | `desafio` / sem nome explícito | `desafioId` → `id` | 0..1 | 0..* | N:1 | SetNull |
| `MetodoSessaoEstudo` → `SessaoEstudo` | `sessao` / sem nome explícito | `sessaoId` → `id` | 1 | 0..* | N:1 | Cascade |
| `FormatoSessaoEstudo` → `SessaoEstudo` | `sessao` / sem nome explícito | `sessaoId` → `id` | 1 | 0..* | N:1 | Cascade |
| `MaterialSessaoEstudo` → `SessaoEstudo` | `sessao` / sem nome explícito | `sessaoId` → `id` | 1 | 0..* | N:1 | Cascade |
| `MaterialSessaoEstudo` → `RecursoConteudo` | `recurso` / sem nome explícito | `recursoId` → `id` | 1 | 0..* | N:1 | Restrict |
| `ConceitoAprendizagem` → `ModuloAprendizagem` | `modulo` / sem nome explícito | `moduloId` → `id` | 1 | 0..* | N:1 | Cascade |
| `ConceitoMaterial` → `ConceitoAprendizagem` | `conceito` / sem nome explícito | `conceitoId` → `id` | 1 | 0..* | N:1 | Cascade |
| `ConceitoMaterial` → `RecursoConteudo` | `recurso` / sem nome explícito | `recursoId` → `id` | 1 | 0..* | N:1 | Cascade |
| `ConceitoSessao` → `ConceitoAprendizagem` | `conceito` / sem nome explícito | `conceitoId` → `id` | 1 | 0..* | N:1 | Cascade |
| `ConceitoSessao` → `SessaoEstudo` | `sessao` / sem nome explícito | `sessaoId` → `id` | 1 | 0..* | N:1 | Cascade |
| `EvidenciaAprendizagem` → `ModuloAprendizagem` | `modulo` / sem nome explícito | `moduloId` → `id` | 1 | 0..* | N:1 | Cascade |
| `EvidenciaAprendizagem` → `RecursoConteudo` | `recurso` / sem nome explícito | `recursoId` → `id` | 0..1 | 0..1 | 1:1 opcional no inverso | SetNull |
| `QuestaoEvidencia` → `EvidenciaAprendizagem` | `evidencia` / sem nome explícito | `evidenciaId` → `id` | 1 | 0..* | N:1 | Cascade |
| `ConceitoEvidencia` → `ConceitoAprendizagem` | `conceito` / sem nome explícito | `conceitoId` → `id` | 1 | 0..* | N:1 | Cascade |
| `ConceitoEvidencia` → `EvidenciaAprendizagem` | `evidencia` / sem nome explícito | `evidenciaId` → `id` | 1 | 0..* | N:1 | Cascade |
| `ConceitoQuestaoEvidencia` → `ConceitoAprendizagem` | `conceito` / sem nome explícito | `conceitoId` → `id` | 1 | 0..* | N:1 | Cascade |
| `ConceitoQuestaoEvidencia` → `QuestaoEvidencia` | `questao` / sem nome explícito | `questaoId` → `id` | 1 | 0..* | N:1 | Cascade |
| `VinculoEvidenciaSessao` → `EvidenciaAprendizagem` | `evidencia` / sem nome explícito | `evidenciaId` → `id` | 1 | 0..* | N:1 | Cascade |
| `VinculoEvidenciaSessao` → `SessaoEstudo` | `sessao` / sem nome explícito | `sessaoId` → `id` | 1 | 0..* | N:1 | Cascade |
| `DesafioExperimentacao` → `Usuario` | `usuario` / sem nome explícito | `usuarioId` → `id` | 1 | 0..* | N:1 | Cascade |
| `DesafioExperimentacao` → `ModuloAprendizagem` | `modulo` / sem nome explícito | `moduloId` → `id` | 1 | 0..* | N:1 | Cascade |
| `EventoAuditoria` → `Usuario` | `ator` / `AtorAuditoria` | `atorId` → `id` | 0..1 | 0..* | N:1 | SetNull |

**Semântica da exclusão:** Cascade exclui a origem dependente quando o destino referenciado é apagado fisicamente; Restrict impede apagar o destino enquanto houver referências; SetNull preserva a origem e limpa a FK opcional. Não representam o comportamento inverso e não são automaticamente equivalentes a composição UML. Todos os onDelete estão explícitos no schema auditado. Não há onUpdate explícito: não atribuir uma regra de atualização personalizada a essas relações. Arquivamento, revogação, desligamento e exclusão lógica são ações de serviço diferentes da exclusão física.

### 5.2 Tabelas intermediárias e associações derivadas para UML

| Extremos conceituais | Intermediário real | Cardinalidade global | Tratamento UML sugerido |
|---|---|---|---|
| `Usuario` ↔ `ModuloAprendizagem` | `AcessoModuloCompartilhado` | N:N; extremos 0..* | Preservar classe associativa: vaga e datas representam concessão/revogação, não propriedade. |
| `Usuario` ↔ `Sala` | `MembroSala` | N:N; extremos 0..* | Somente vista de persistência/legado; autorização atual é modular. |
| `Usuario` ↔ `ModuloSala` | `ParticipacaoModuloSala` | N:N; extremos 0..* | Preservar classe associativa com papel, situação e datas. |
| `ModuloSala` ↔ `ModuloAprendizagem` | `VinculoModuloSala` | N:N; extremos 0..* | Preservar vínculo e participação; por par módulo coletivo/pessoal existe no máximo um vínculo. |
| `PerfilAluno` ↔ `Turma` | `Matricula` | N:N; extremos 0..* | Associativa legada; omitir do diagrama funcional principal. |
| `PerfilProfessor` ↔ `RecursoConteudo` | `AprovacaoRecurso` | N:N; extremos 0..* | Associativa legada com estado e observação. |
| `SessaoEstudo` ↔ `RecursoConteudo` | `MaterialSessaoEstudo` | N:N; extremos 0..* | Pode virar associação direta 0..* ↔ 0..* no domínio. |
| `ConceitoAprendizagem` ↔ `RecursoConteudo` | `ConceitoMaterial` | N:N; extremos 0..* | Manter classe associativa se trechosJson for relevante. |
| `ConceitoAprendizagem` ↔ `SessaoEstudo` | `ConceitoSessao` | N:N; extremos 0..* | Pode virar associação direta 0..* ↔ 0..*. |
| `ConceitoAprendizagem` ↔ `EvidenciaAprendizagem` | `ConceitoEvidencia` | N:N; extremos 0..* | Pode virar associação direta 0..* ↔ 0..*. |
| `ConceitoAprendizagem` ↔ `QuestaoEvidencia` | `ConceitoQuestaoEvidencia` | N:N; extremos 0..* | Pode virar associação direta em vista detalhada. |
| `EvidenciaAprendizagem` ↔ `SessaoEstudo` | `VinculoEvidenciaSessao` | N:N; extremos 0..* | Preservar classe associativa se origem do vínculo for mostrada. |

MetodoSessaoEstudo e FormatoSessaoEstudo também normalizam seleções múltiplas, mas possuem apenas uma FK real cada: metodo e formato são valores de enumeração, não FKs. Na UML de domínio podem ser atributos multivalorados metodos: MetodoEstudo[0..*] e formatos: FormatoConteudo[0..*]. A regra do serviço para novos registros exige ao menos um de cada (validarContextoBasico/schemas em src/servidor/sessoes.ts); marcar [1..*] só se a figura declarar esse recorte de registros válidos, e não como restrição garantida exclusivamente pelo banco.

### 5.3 Restrições que evitam associações inventadas

- ParticipacaoModuloSala pode existir sem VinculoModuloSala: participação 1 → vínculo 0..1; cada vínculo exige exatamente uma participação, graças à FK obrigatória e única. Não ligar o vínculo ao MembroSala legado: essa FK não existe mais.
- CompartilhamentoModulo e AcessoModuloCompartilhado se relacionam com o módulo; não existe FK direta entre eles. O proprietário é alcançado por ModuloAprendizagem.usuarioId, não por uma coluna de proprietário no acesso.
- A regra de três convidados ativos usa vagas 1, 2 e 3 em aceitarCodigoModulo. O schema impõe unicidade (moduloId,vaga), mas não restringe sozinho o inteiro a 1–3; acessos revogados têm vaga nula. Por isso, a multiplicidade persistente é 0..*, com restrição de serviço {até 3 ativos}, e não três registros históricos no máximo.
- Um material pode ter zero ou uma evidência e uma evidência pode referenciar zero ou um material: recursoId é opcional e único, com SetNull. Não modelar como obrigatoriedade recíproca 1:1.
- EvidenciaHistoricaModuloSala não possui FK de usuário, sessão original, participação ou módulo pessoal. Seus hashes não criam associações UML físicas para esses modelos.
- EventoAuditoria.alvo é texto, não uma relação polimórfica formal com todas as entidades. AnaliseMaterial.origem/modelo, ConceitoAprendizagem.origem e campos JSON também não introduzem FKs.
- FKs separadas em SessaoEstudo/VinculoModuloSala não são uma restrição composta que garanta, no banco, igualdade entre proprietários ou módulos de registros associados. Consistência contextual adicional é validada nos serviços.
- Não há relação de herança Prisma entre Usuario, PerfilAluno e PerfilProfessor: existem relações 1:0..1 independentes. Não criar subclasses mutuamente exclusivas sem regra demonstrada.
- Não há modelos atuais ComentarioSala, Topico, Avaliacao, Questao, TentativaAvaliacao, RespostaQuestao ou Recomendacao. QuestaoEvidencia e EvidenciaAprendizagem são modelos reais diferentes; o valor de enum AVALIACAO não restaura a tabela antiga.

## 6. Estado funcional: estrutura atual, auxiliares e legado

| Aspecto | Evidência atual de código | Consequência documental |
|---|---|---|
| Autenticação | src/servidor/autenticacao.ts, obterUsuarioAtual/definirSessaoDemonstracao; sessao-assinada.ts, criarTokenSessao/validarTokenSessao | Cookie utiliza token assinado; não há modelo de sessão/token persistido no schema. Não reutilizar a descrição antiga de cookie com id puro. |
| Compartilhamento direto | src/servidor/compartilhamento-modulos.ts, aceitarCodigoModulo, removerAcessoModulo, exigirAcessoDashboardCompartilhado | As duas entidades de compartilhamento são atuais e independem da organização em salas. |
| Participação em sala | src/servidor/salas.ts:309–393, gerarConviteModuloSala/entrarModuloSalaComCodigo; 408–451, vincularInstanciaModuloSala | Convite autoriza módulo específico; ParticipacaoModuloSala é a fonte funcional de ingresso e autorização. |
| Modelo coletivo | src/servidor/paineis-salas.ts:36–145, obterDashboardModuloSalaDoProprietario | Agregação é por ModuloSala; não criar entidade persistida de dashboard geral de sala. |
| MembroSala/ConviteSala/SolicitacaoEntradaSala | Schema e AiFiles/Contexto/Tecnico/MODELO_DE_DADOS.md; serviços atuais usam participação/convite modular; limpeza ainda referencia tabelas antigas | Permanecem no inventário completo porque ainda existem, mas não representam a autorização de ingresso atual. |
| Perfis/turmas/aprovações | Schema; busca dos delegates em src sem consultas funcionais encontradas, além de referências de manutenção/seed | Identificar como estruturas históricas; não omitir do inventário, mas separar da UML central. Não foi inspecionado conteúdo de linhas do banco. |
| Campos históricos | Comentários no schema: Usuario.papel; SessaoEstudo.alunoId/observacao; flags de confirmação e dataEventoConfirmada | Enumerar todos na persistência; omitir detalhes históricos do núcleo acadêmico sem afirmar que foram removidos fisicamente. |
| Métodos/desafios | src/dominio/sessoes/metodos.ts; src/servidor/desafios.ts; src/app/desafios/page.tsx | Métodos são valores de enum; DesafioExperimentacao existe, com serviços preservados, enquanto a página atual apresenta catálogo. |
| Configuração de IA | src/servidor/ia/configuracoes.ts, exigirPermissaoConfiguracaoIa/listarCredenciaisAtivas; catálogo de provedores | Relação estrutural permite configurações por conta/provedor; regra funcional atual usa configuração global Groq administrada pela conta autorizada. Não apagar enum histórico da documentação física. |
| Análise de material | src/servidor/analises-materiais.ts, processarAnaliseMaterial; src/servidor/ia/analise-materiais.ts | AnaliseMaterial persiste resultados de conteúdo, não as interpretações ordinárias dos dashboards. |

Não há modelos persistidos de estilo fixo de aprendizagem, métrica acumulada, dashboard, insight ordinário ou recomendação analítica. O corpus de avaliação da IA em arquivos JSON também não é tabela do banco. Documentação anterior pode conter afirmações de outra versão: schema e código atuais prevalecem, inclusive sobre trechos antigos do próprio MODELO_DE_DADOS.md que negam evidências ou desempenho no modelo ativo.

## 7. Proposta textual para o Diagrama de Classes UML

### 7.1 Persistência não equivale a classe de domínio

Os modelos Prisma são estruturas de persistência; o projeto usa principalmente funções de serviço e tipos TypeScript, sem uma classe orientada a objetos homônima para cada tabela. Uma UML acadêmica pode representar esses conceitos como classes de domínio, desde que explicite essa adaptação. Não se deve atribuir métodos como salvar(), excluir(), calcularNota() ou gerarInsight() às entidades: a simples existência de operações em serviços não comprova métodos de instância. Esta proposta contém apenas atributos e associações verificáveis.

Para a vista de domínio, substituir FKs por associações e manter, se útil, somente id como identidade. Usar nomes reais (ou rótulo Material com nota “corresponde a RecursoConteudo”). Converter textos JSON em propriedades conceituais de coleção somente quando declarada a projeção e comprovado o tipo lido no código; no inventário físico continuam String. Não apresentar segredos cifrados como atributos centrais de negócio.

### 7.2 Classes e atributos relevantes

| Classe/conceito | Atributos existentes a destacar | Prioridade/recorte |
|---|---|---|
| `Usuario` | id, nome, nomeUsuario, email; administradorIa apenas no recorte técnico | Essencial |
| `ModuloAprendizagem` | id, identificador, titulo, descricao, arquivado, rascunho | Essencial |
| `RecursoConteudo` | id, titulo, descricao, formato, origem, funcao, ativo, dataEvento | Essencial |
| `SessaoEstudo` | id, descricao, modoRegistro, iniciadaEm, encerradaEm, duracaoMinutos, situacao, arquivada, compreensaoPercebida, dificuldadePercebida | Essencial |
| `ConceitoAprendizagem` | id, nome, chave, aliasesJson, origem, ativo | Essencial |
| `EvidenciaAprendizagem` | id, titulo, tipo, dataEvento, desempenhoPercentual, resumo | Essencial |
| `QuestaoEvidencia` | id, identificador, resumo, tipo, resultado, pontuacaoObtida, pontuacaoMaxima | Detalhamento relevante |
| `Sala` | id, identificador, nome, descricao, situacao | Essencial |
| `ModuloSala` | id, titulo, descricao, posicao, situacao | Essencial |
| `ParticipacaoModuloSala` | id, papel, situacao, entrouEm, encerrouEm | Classe associativa essencial |
| `ConviteModuloSala` | id, expiraEm, revogadoEm, criadoEm; codigoHash somente no detalhe técnico | Essencial para ingresso |
| `VinculoModuloSala` | id, situacao, compartilharDashboard, vinculadoEm, dadosDesde, desvinculadoEm | Classe associativa essencial |
| `CompartilhamentoModulo` | id, atualizadoEm; codigoHash opcional no detalhe de implementação | Essencial no recorte de compartilhamento |
| `AcessoModuloCompartilhado` | id, vaga, concedidoEm, revogadoEm | Classe associativa essencial |
| `AnaliseMaterial` | id, situacao, versao, resumo, conceitosJson, pontosRevisaoJson, origem, modelo, conteudoTruncado, analisadaEm | Essencial se representar análise de materiais |
| `ArquivoMaterial` | id, nomeOriginal, tipoMime, tamanhoBytes, extensaoNormalizada | Auxiliar técnico |
| `VinculoEvidenciaSessao` | origem; identidade composta pelos extremos; confirmado só como legado | Classe associativa relevante |
| `ConceitoMaterial` | trechosJson; identidade composta pelos extremos | Classe associativa com atributo próprio |
| `EvidenciaHistoricaModuloSala` | encerradaEm, duracaoMinutos, dificuldadePercebida, compreensaoPercebida, metodosJson, formatosJson | Auxiliar de histórico analítico |
| `DesafioExperimentacao` | id, metodo, meta, situacao, criadoEm, canceladoEm | Auxiliar de domínio; serviços preservados |
| `ConfiguracaoIa` | id, provedor, ativa, estadoUltimoTeste, ultimoTesteEm, bloqueadaAte | Técnico de suporte |
| `EventoAuditoria` | id, acao, alvo, metadados, criadoEm | Técnico de infraestrutura |

**Núcleo sugerido:** Usuario, ModuloAprendizagem, RecursoConteudo, SessaoEstudo, ConceitoAprendizagem e EvidenciaAprendizagem. Incluir QuestaoEvidencia se a granularidade por questão for discutida. Para demonstrar as formas atuais de compartilhamento, acrescentar Sala, ModuloSala, ParticipacaoModuloSala, ConviteModuloSala, VinculoModuloSala, CompartilhamentoModulo e AcessoModuloCompartilhado. AnaliseMaterial representa a análise persistida de conteúdo. Os demais podem ficar em vistas complementares.

### 7.3 Associações e multiplicidades a transportar para UML

- Usuario 1 ↔ ModuloAprendizagem 0..* (propriedade); Usuario 1 ↔ SessaoEstudo 0..* (autoria). ModuloAprendizagem 1 ↔ RecursoConteudo/SessaoEstudo/ConceitoAprendizagem/EvidenciaAprendizagem 0..* (quatro associações distintas).
- RecursoConteudo 1 ↔ ArquivoMaterial 0..1 e RecursoConteudo 1 ↔ AnaliseMaterial 0..1. RecursoConteudo 0..1 ↔ EvidenciaAprendizagem 0..1; EvidenciaAprendizagem 1 ↔ QuestaoEvidencia 0..*.
- SessaoEstudo e RecursoConteudo 0..* ↔ 0..*; ConceitoAprendizagem e material/sessão/evidência/questão 0..* ↔ 0..* (quatro associações). EvidenciaAprendizagem e SessaoEstudo 0..* ↔ 0..*, conservando a classe associativa do vínculo quando necessário.
- Usuario 1 ↔ Sala 0..* no papel proprietário; Sala 1 ↔ ModuloSala 0..*. Usuario 1 ↔ ParticipacaoModuloSala 0..* e ModuloSala 1 ↔ ParticipacaoModuloSala 0..*.
- ParticipacaoModuloSala 1 ↔ VinculoModuloSala 0..1; ModuloSala 1 ↔ VinculoModuloSala 0..*; ModuloAprendizagem 1 ↔ VinculoModuloSala 0..*; Usuario 1 ↔ VinculoModuloSala 0..*. A última associação pode ser omitida na vista simplificada como redundância navegável, com nota de que a FK continua na persistência.
- ModuloSala 1 ↔ ConviteModuloSala 0..*; Usuario 1 ↔ ConviteModuloSala 0..* no papel criador. ModuloSala 1 ↔ EvidenciaHistoricaModuloSala 0..*, se esse histórico for apresentado.
- ModuloAprendizagem 1 ↔ CompartilhamentoModulo 0..1; ModuloAprendizagem 1 ↔ AcessoModuloCompartilhado 0..*; Usuario 1 ↔ AcessoModuloCompartilhado 0..* no papel convidado. Anotar {até 3 acessos ativos por módulo} como regra de serviço, sem limitar o histórico persistido.
- Se incluídos: Usuario 1 ↔ ConfiguracaoIa 0..*; Usuario 0..1 ↔ EventoAuditoria 0..*; DesafioExperimentacao 0..1 ↔ SessaoEstudo 0..*, além das ligações obrigatórias do desafio com conta e módulo.

As relações restantes da vista física/legada estão integralmente na seção 5. Não impor multiplicidade 1..* por haver dados no seed: listas do schema admitem zero elementos. Um campo de FK obrigatório garante um pai por filho, não a existência de filhos para todo pai.

### 7.4 Enumerações na figura acadêmica

Priorizar MetodoEstudo, FormatoConteudo, ModoRegistroSessao, SituacaoSessao, FuncaoMaterial e TipoEvidenciaAprendizagem no núcleo. Acrescentar PapelParticipacaoModuloSala, SituacaoParticipacaoModuloSala, SituacaoVinculoModuloSala e estados de Sala/ModuloSala no recorte colaborativo; SituacaoAnaliseMaterial no recorte de análise. ProvedorIa e EstadoConfiguracaoIa pertencem ao detalhe técnico, com nota de que somente Groq está ativo no catálogo. Todos os valores completos estão na seção 4; pode-se listar apenas o nome do enum na figura e remeter à tabela, evitando ilegibilidade.

### 7.5 Learning Analytics e insights como tipos calculados, sem tabela

| Tipo implementado (possível classe conceitual) | Atributos/campos reais relevantes | Fonte e natureza |
|---|---|---|
| MetricasSessoes | moduloId, versaoAlgoritmo, tempoEstudo, frequencia, regularidade, percepcoes, porMetodo, porFormato, evolucaoSemanal, criterios, limitacoes | src/dominio/analises/metricas-sessoes.ts:47–89; objeto calculado por calcularMetricasSessoes, não entidade persistida |
| ResultadoContextoAprendizagem | chave, quantidadeSessoes, quantidadeCompreensoes, compreensaoMedia, quantidadeEvidenciasPosteriores, desempenhoMedioPosterior, amostraEvidenciasSuficiente | src/dominio/analises/aprendizagem-modulo.ts:40–48; resultado de agregação |
| ClassificacaoConceitoAprendizagem | chave, nome, sessoes, evidencias, observacoes, compreensaoMedia, dificuldadeMedia, desempenhoMedio, evidenciasSuficientes, indice, ultimaObservacaoEm e contagens de percepção | Mesmo arquivo, 50–64; projeção exploratória, não perfil fixo |
| RecomendacaoMaterial | tipo, moduloId, conceitoId, materialId, tituloMaterial, regraId, indicadoresUtilizados, tamanhoAmostra, justificativaEstruturada, limitacoes, nivelEvidencia | src/dominio/analises/recomendacoes-materiais.ts:8–14; IDs textuais em retorno de função, sem FK própria no banco |
| DtoInterpretacao | escopo, versaoAlgoritmo, quantidadeModulos, quantidadeSessoesValidas, minutosValidos, periodo, modulos, evolucaoSemanal, descricoesSessoes e campos opcionais | src/dominio/interpretacoes/esquema.ts:8–58; entrada estruturada da interpretação |
| InsightAprendizagem | tipo, titulo, observacao, resumoEvidencias, perguntaReflexiva, experimentoSugerido, confianca | Mesmo arquivo, 60–72; tipo inferido do schema Zod |
| ConteudoInterpretacao / InterpretacaoGerada | insights; origem, modelo, motivoContingencia, tentativas, contexto, limitacao e coleções de apresentação | Mesmo arquivo, 70–93; resultado transitório, distinto de AnaliseMaterial persistido |

Para mostrar esse recorte na UML, usar estereótipos como «DTO» ou «resultado calculado» e dependências de uso/derivação, não relacionamentos de banco inventados. ConteudoInterpretacao contém insights: InsightAprendizagem[1..3], cardinalidade comprovada pelo Zod; InterpretacaoGerada incorpora esse conteúdo por composição de tipos TypeScript, sem comprovar herança de classes em execução. Não inferir unicidade 1:1 entre módulo e métricas/insight: recortes de período podem gerar vários objetos ao longo do tempo, sem identidades persistidas. Esses tipos são opcionais na figura principal de domínio e podem compor uma vista própria de processamento.

Os tipos de insight são OBSERVACAO, CALIBRACAO, ESTRATEGIA, PROGRESSO, DIFICULDADE e EXPERIMENTO; confiança é BAIXA, MODERADA ou FORTE. São uniões/enumerações do contrato Zod, não enums adicionais de schema.prisma. OrigemInterpretacao é atualmente GROQ ou LOCAL. Campos resumoEvidencias, perguntaReflexiva e experimentoSugerido admitem null, conforme o contrato.

## 8. Simplificações recomendadas e cuidados de representação

1. Usar uma vista central de estudo e uma vista de compartilhamento; uma única figura com todos os modelos, enums e campos técnicos dificulta leitura. O inventário completo deve permanecer como apoio/apêndice.
2. Omitir PKs compostas e FKs repetidas do compartimento de atributos quando as associações já as representam; preservá-las na vista de persistência desta documentação.
3. Substituir tabelas de seleção de métodos/formatos por atributos multivalorados de enum. Colapsar tabelas associativas sem atributos em N:N; preservar ConceitoMaterial e VinculoEvidenciaSessao quando seus dados próprios forem importantes.
4. Manter ParticipacaoModuloSala, VinculoModuloSala e AcessoModuloCompartilhado como conceitos separados: possuem estados, papéis, datas ou regras de acesso que se perderiam em uma associação genérica Usuario–Modulo.
5. Retirar PerfilAluno, PerfilProfessor, Turma, Matricula, AprovacaoRecurso, MembroSala, ConviteSala e SolicitacaoEntradaSala do núcleo funcional; se necessário, apresentá-los em pacote «compatibilidade histórica». Não excluí-los do inventário físico, pois ainda estão no schema.
6. Omitir hash de senha, foto em bytes, chaves cifradas, vetores, etiquetas e timestamps de manutenção na figura de domínio; constam integralmente no inventário, sem exposição de valores sensíveis.
7. Não usar Cascade como critério automático de composição; ciclo de vida lógico, Restrict e referências múltiplas precisam ser considerados. Associação simples é a representação mais conservadora onde exclusividade de composição não foi demonstrada.
8. Não desenhar herança aluno/professor/administrador, entidade de método ou provedor como tabela, vínculo direto de histórico pseudonimizado ao usuário, nem métodos de entidade sem implementação correspondente.
9. Identificar no título da futura figura se ela representa domínio, persistência ou uma vista mista explicitamente anotada. Usar multiplicidades estruturais desta análise e anotar regras de serviço separadamente.
10. Não incorporar ComentarioSala ou tabelas antigas removidas apenas porque aparecem em migrações históricas. Também não omitir as novas entidades de compartilhamento direto ou de participação modular por reproduzir documentação anterior.

## 9. Rastreabilidade e verificação documental

Cada modelo possui referência de linha ao schema na seção 3; todas as relações com FK e nomes explícitos estão na seção 5; todos os enums e seus consumidores constam na seção 4. As observações funcionais citam os serviços/tipos pertinentes na seção 6 e na proposta UML. Não foram utilizados resultados antigos de testes para validar esta documentação.

**Cobertura da extração:** 266 atributos escalares/enums e 118 campos de navegação distribuídos nos 36 modelos; 59 relações proprietárias de FK. Os campos de relação não foram contados como colunas. A documentação foi conferida contra os nomes, tipos, chaves, unicidades e ações de exclusão declarados, sem operações de aplicação.

**Limite da evidência:** este relatório comprova correspondência documental com a estrutura implementada inspecionada. Não atesta que uma instância específica do SQLite esteja migrada, que todos os modelos contenham registros ou que todos os caminhos de negócio tenham sido executados. Nenhum diagrama visual foi gerado.
