# Desenho — Dashboards da sala espelhados

## Objetivo

Fazer os painéis administrativos da sala reutilizarem as visualizações já existentes na plataforma:

- o dashboard individual autorizado de cada membro deve exibir os mesmos cards e gráficos do Dashboard do Módulo;
- o dashboard geral da sala deve exibir os mesmos cards e gráficos do Dashboard Principal, consolidados entre os membros autorizados;
- o dashboard geral da sala não deve exibir “Consistência dos métodos entre módulos” nem “Base das análises”.

## Decisões aprovadas

- Somente membros ativos que autorizaram o compartilhamento do dashboard participam das visualizações.
- O limite de privacidade já existente permanece: o agregado geral só fica disponível com pelo menos três contribuidores com sessão válida.
- A autorização para comparação e a autorização para IA continuam independentes do compartilhamento do dashboard.
- Arquivos, materiais, descrições de sessões e registros brutos dos membros não serão enviados ao administrador.
- Os nomes de conceitos e os indicadores analíticos podem aparecer no dashboard individual porque integram o painel de aprendizagem autorizado; eles serão produzidos no servidor e entregues como resultados consolidados.
- Evidências históricas anonimizadas de pessoas que deixaram de compartilhar não participam dos novos painéis espelhados, pois não contêm todas as análises necessárias.
- A interpretação por IA do membro continua aparecendo somente quando `permitirIa` estiver ativo.
- O dashboard geral da sala não receberá uma nova interpretação por IA nesta entrega.

## Arquitetura

### Composição compartilhada do Dashboard do Módulo

Será criado um componente de composição que reúna:

- `PainelMetricasSessoes`;
- `PainelResultadosContextuais`;
- `PainelConceitosDestaque`.

A página do módulo pessoal e o dashboard individual da sala usarão essa mesma composição. Assim, mudanças futuras nos cards e gráficos do módulo não exigirão uma segunda implementação na Sala.

### Dados individuais autorizados

Para cada vínculo ativo com `compartilharDashboard: true`, o servidor continuará calculando as métricas de sessões e também obterá a aprendizagem do módulo pessoal pela mesma função usada na página do módulo. O DTO administrativo conterá apenas:

- métricas serializadas;
- resumo de resultados;
- resultados por método e formato;
- classificações consolidadas de conceitos;
- metadados do vínculo e permissões.

O DTO não conterá sessões brutas, descrições, materiais, arquivos ou o conteúdo analisado.

### Agregação do Dashboard Geral da sala

As sessões dos vínculos autorizados serão associadas aos módulos correspondentes da sala. As análises de aprendizagem também serão projetadas para esses módulos. O serviço usará o mesmo domínio do Dashboard Principal para produzir um `DashboardObservacional` compatível com:

- `CartoesInsightsDashboard`;
- `GraficosDashboard`.

Serão exibidos os cards e gráficos atuais desses componentes. A página da sala não renderizará `ConsistenciaMetodosDashboard`, “Base das análises”, métricas históricas expansíveis nem a coluna de interpretação por IA.

## Privacidade e estados vazios

- O proprietário da sala continua sendo o único usuário autorizado a consultar os painéis administrativos.
- Um membro sem compartilhamento de dashboard não aparece individualmente e não entra no agregado.
- Com menos de três contribuidores válidos, o painel geral continua oculto e informa apenas a quantidade necessária.
- Cards e gráficos sem evidências suficientes usam os estados vazios já existentes nos componentes originais.
- Nenhuma ausência de evidência será substituída por estimativa, dado histórico incompleto ou inferência da IA.

## Interface

- O dashboard geral aparecerá primeiro na área “Dashboards da sala”.
- Cada módulo da sala continuará agrupando comparação e dashboards individuais.
- O dashboard individual ficará dentro do detalhe do membro e preservará a interpretação por IA quando autorizada.
- A aparência será adaptada apenas no contêiner da Sala; os cards e gráficos internos permanecerão visualmente iguais aos originais.

## Verificação

- Testes do serviço devem provar autorização, mínimo de contribuidores, agregação entre módulos e ausência de dados privados no DTO.
- Testes de renderização devem provar que a composição compartilhada contém todos os painéis do módulo e que o painel geral contém cards e gráficos, sem Consistência ou Base das análises.
- A entrega deve passar por testes de Sala, testes unitários, ESLint, TypeScript, scanner de segredos e build.
- Após a validação, o site deve ser iniciado para inspeção local.
