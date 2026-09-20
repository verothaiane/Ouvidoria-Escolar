# Sistema de Ouvidoria Escolar

O projeto é uma aplicação Web Full-Stack desenvolvida para facilitar e centralizar a comunicação entre a comunidade escolar (alunos, pais, colaboradores) e a diretoria da instituição. O sistema permite o envio de relatos, sugestões e denúncias de forma segura, com opção de anonimato e rastreabilidade via protocolo.

Projeto desenvolvido como requisito da Atividade Extensionista II para implementação de solução tecnológica na comunidade local.

🌍 **[Acesse o sistema aqui!](https://verothaiane.github.io/Ouvidoria-Escolar/)**

---

## Funcionalidades

### Para a Comunidade (Usuários)
- **Envio de Relatos:** Formulário intuitivo para registrar demandas por categoria (Infraestrutura, Pedagógico, Assédio/Abuso, etc.).
- **Garantia de Anonimato:** Opção de ocultar dados pessoais durante o envio.
- **Rastreabilidade:** Geração automática de um número de protocolo único e senha de acompanhamento.
- **Consulta de Status:** Área dedicada para acompanhar o andamento do relato em tempo real usando o protocolo gerado.

### Para a Gestão (Diretoria)
- **Painel Administrativo:** Acesso restrito protegido por autenticação.
- **Gestão de Demandas:** Visualização de todos os relatos recebidos.
- **Atualização de Status:** Capacidade de alterar a situação do chamado (ex: *Recebido, Em Análise, Concluído*) para manter a comunidade informada.

---

## Tecnologias Utilizadas

O projeto adota uma arquitetura Cliente-Servidor separada, com banco de dados relacional na nuvem.

**Front-end (Interface Visual)**
- HTML5, CSS3 e JavaScript (Vanilla)
- Design Responsivo
- Hospedagem: **GitHub Pages**

**Back-end (API e Servidor)**
- Node.js
- Express.js (Roteamento e middlewares)
- CORS & MySQL2
- Hospedagem da API: **Render**

**Banco de Dados**
- MySQL 8.4
- Estrutura Relacional (Tabelas de Relatos, Histórico e Equipe)
- Hospedagem: **Aiven Cloud**

---

## Como executar o projeto localmente

Se deseja baixar e rodar este projeto no seu próprio computador, siga os passos abaixo:

### Pré-requisitos
- Node.js instalado.
- Servidor MySQL local (como XAMPP ou MySQL Workbench) para rodar o banco de dados.

### Instalação
1. Clone este repositório:
   ```
   git clone https://github.com/verothaiane/Ouvidoria-Escolar.git
   ```
2. Acesse à pasta do projeto:
   ```
   cd Ouvidoria-Escolar
   ```
3. Instale as dependências do Node:
   ```
   npm install
   ```
4. Configure o Banco de Dados:
   - Abra o ficheiro `server.js`.
   - Substitua as credenciais de ligação do banco de dados na nuvem pelas credenciais do seu banco local (ex: `host: 'localhost'`, `user: 'root'`).
   - Execute as *queries* de criação de tabelas (`CREATE TABLE`) no seu banco local.

5. Inicie o servidor:
   ```
   node server.js
   ```
6. O servidor rodará na porta 3000. Abra o ficheiro `index.html` no seu navegador ou use o Live Server para utilizar o sistema.

---

## Acesso para Testes (Área da Equipe)

Para fins de avaliação e demonstração do painel administrativo, utilize as seguintes credenciais de teste na aba "Equipe":

- **E-mail:** `diretoria@ruibarbosa.pr.gov.br`
- **Senha:** `Diretoria123@`
