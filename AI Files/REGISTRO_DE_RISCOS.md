# Registro de riscos

| ID | Risco | Prob. | Impacto | Mitigação | Gatilho |
|---|---|---:|---:|---|---|
| R-01 | Apresentar associação como causalidade | Alta | Alto | Linguagem condicionada, nível de evidência e explicação obrigatória | Texto afirmar que um formato “faz” o aluno aprender |
| R-02 | Personalização com poucos dados | Alta | Alto | Estado de dados insuficientes e recomendação de exploração | Melhor formato indicado com menos de 2 evidências |
| R-03 | Comparar avaliações não equivalentes | Média | Alto | Quizzes de mesmo tópico, limite explícito e cenários sintéticos controlados | Comparação entre tópicos/instrumentos distintos |
| R-04 | Escopo excessivo | Alta | Alto | MVP local, sem integrações externas ou dados reais | Funcionalidade não rastreável ao MVP |
| R-05 | Exposição de dados pessoais | Baixa | Alto | Somente dados sintéticos; autorização por papel no servidor | Dado real no repositório ou seed |
| R-06 | Cálculo analítico incorreto | Média | Alto | Funções puras, casos de referência e testes | Divergência de cenário esperado |
| R-07 | Fonte externa indisponível durante demo | Média | Médio | Recursos descritivos internos no seed | Fluxo depender de URL externa |
| R-08 | Credenciais sintéticas confundidas com segurança de produção | Média | Alto | Hash de senha, validação no servidor, contas declaradamente fictícias e sem uso público | Implantar a versão local com dados reais ou senhas reutilizadas |
