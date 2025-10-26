# 🖥️ Sistema de Gerenciamento Escolar - Jesuit School

## 📘 Visão Geral

O **Sistema de Gerenciamento Escolar - Jesuit School** foi desenvolvido com o objetivo de otimizar e automatizar processos administrativos e acadêmicos de uma instituição jesuíta.  
O sistema permite realizar o **cadastro e gerenciamento de alunos, turmas, professores, disciplinas e notas**, além de gerar relatórios completos.

O projeto foi desenvolvido utilizando a **linguagem Java (com JOptionPane)** e **arquitetura orientada a objetos**, prezando pela **organização modular e manutenção facilitada**.

---

## 🧠 Objetivo do Projeto

O sistema tem como principais objetivos:
- Facilitar o **cadastro e gerenciamento de alunos, professores e turmas**.
- Permitir o **lançamento de notas e geração de relatórios de desempenho**.
- Oferecer uma interface simples e intuitiva via **JOptionPane**.
- Garantir **armazenamento estruturado** e manipulação de dados organizada.

---

## ⚙️ Tecnologias Utilizadas

| Tecnologia | Descrição |
|-------------|------------|
| **Java SE** | Linguagem principal do sistema |
| **JOptionPane** | Interface gráfica simplificada |
| **Orientação a Objetos (POO)** | Estrutura de desenvolvimento modular |
| **IntelliJ IDEA** | IDE utilizada no desenvolvimento |
| **Maven (opcional)** | Gerenciamento de dependências, se aplicado |

---

## 🧩 Estrutura do Projeto

A estrutura de pastas foi organizada de forma modular para facilitar a manutenção e compreensão:

System/
│
├── Aluno/
│ ├── GAluno.java # Classe responsável pelo gerenciamento de alunos
│ ├── MenuAluno.java # Menu de operações de alunos
│
├── Turma/
│ ├── GTurma.java # Classe responsável pelo gerenciamento de turmas
│ ├── MenuTurma.java # Menu de operações de turmas
│
├── Disciplinas/
│ ├── GDisciplina.java # Classe de gerenciamento de disciplinas
│ ├── MenuDisciplina.java # Menu de operações de disciplinas
│
├── Professor/
│ ├── GProfessor.java # Classe responsável pelo gerenciamento de professores
│ ├── MenuProfessor.java # Menu de operações de professores
│
├── Main.java # Classe principal com o menu inicial do sistema
│
└── ClassesExternas/
├── Aluno.java # Classe modelo (getters e setters)
├── Turma.java
├── Disciplina.java
├── Professor.java

yaml
Copiar código

---

## 🗄️ Banco de Dados

> ⚠️ Atualmente, o sistema utiliza **armazenamento em memória**.  
> Caso desejado, poderá ser integrada uma **base de dados MySQL ou SQLite**, conforme o avanço do projeto.

### Modelo de Dados (Lógico)

| Entidade | Atributos |
|-----------|------------|
| **Aluno** | ID, Nome, Idade, Turma, Notas |
| **Turma** | ID, Nome, Série, ProfessorResponsável |
| **Professor** | ID, Nome, Disciplina, Email |
| **Disciplina** | ID, Nome, CargaHorária |
| **Notas** | IDAluno, IDDisciplina, Nota1, Nota2, MédiaFinal |

---

## 🧰 Funcionalidades

✅ **Cadastro e consulta de alunos**  
✅ **Cadastro e gerenciamento de turmas**  
✅ **Cadastro de professores e disciplinas**  
✅ **Lançamento e cálculo de notas**  
✅ **Geração de relatórios**  
✅ **Exibição via JOptionPane**  
✅ **Estrutura modular e orientada a objetos**

---

## 🧾 Requisitos

### 🖥️ Requisitos de Software
- **Java JDK 17** ou superior  
- **IntelliJ IDEA** (ou NetBeans / VS Code com extensão Java)  
- (Opcional) **Maven** para gerenciamento de dependências  

### ⚙️ Requisitos de Hardware
- Processador dual-core ou superior  
- 2 GB de RAM livre  
- 200 MB de espaço disponível

---

## 🚀 Execução do Sistema

1. **Abra o projeto** na IDE de sua preferência (ex: IntelliJ IDEA).  
2. Compile o projeto (`Build Project`).  
3. Execute a classe principal `Main.java`.  
4. Navegue pelos menus exibidos via `JOptionPane`.

---

## 🧮 Exemplo de Menu Principal

```java
String opcao = JOptionPane.showInputDialog(
    "===== SISTEMA ESCOLAR JESUIT SCHOOL =====\n" +
    "1 - Gerenciar Alunos\n" +
    "2 - Gerenciar Professores\n" +
    "3 - Gerenciar Disciplinas\n" +
    "4 - Gerenciar Turmas\n" +
    "5 - Gerar Relatórios\n" +
    "0 - Sair\n" +
    "Escolha uma opção:"
);
🧠 Boas Práticas Implementadas
Modularização por pacotes

Encapsulamento de dados (getters e setters)

Métodos específicos para CRUD (Create, Read, Update, Delete)

Reutilização de código por herança e composição

Organização clara da estrutura do projeto

📈 Possíveis Melhorias Futuras
🔐 Integração com banco de dados MySQL

🌐 Criação de interface web (Java + Spring Boot)

🧾 Exportação de relatórios em PDF

📬 Envio de notificações por e-mail

🧑‍💼 Login de usuários com níveis de permissão

👨‍💻 Autor
Jô Abreu
Estudante de Análise e Desenvolvimento de Sistemas - Unifametro
Técnico em Desenvolvimento de Sistemas - SENAI
💼 Foco em desenvolvimento back-end, redes e infraestrutura
📧 Contato: (inserir e-mail, se desejar)

📜 Licença
Este projeto é de uso acadêmico e pode ser adaptado livremente para fins educacionais.
© 2025 Jô Abreu. Todos os direitos reservados.
