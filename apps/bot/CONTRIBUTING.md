# Contributing to Oliver

Thank you for your interest in contributing to this project! We welcome contributions from the community and appreciate your time and effort. To ensure a smooth collaboration, please follow the guidelines outlined below.

## Table of Contents

- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Code Style](#code-style)
- [Branching and Pull Requests](#branching-and-pull-requests)
- [Testing](#testing)
- [Issues](#issues)
- [License](#license)

## Getting Started

1. Fork the repository to your GitHub account.
2. Clone your fork to your local machine:

   ```bash
   git clone https://github.com/ivanoliverfabra/oliver-bot
   ```

3. Navigate to the project directory:

   ```bash
   cd oliver-bot
   ```

4. Install dependencies:

   ```bash
   bun install
   ```

5. Create a `.env` file in the root directory and add your bot token and any other required environment variables:

   ```bash
   DISCORD_TOKEN=your-discord-token
   DISCORD_GUILD_ID=your-discord-guild-id
   ```

6. Run the bot locally:

   ```bash
   bun dev
   ```

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue on GitHub. When reporting bugs, include as much information as possible, such as:

- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Logs or screenshots (if applicable)

### Feature Requests

If you have ideas for new features, feel free to open an issue with your suggestion. Provide as much detail as possible to explain your idea.

### Pull Requests

1. Before starting any work, ensure there's an open issue or feature request. If not, open a new issue.
2. Fork the repository and create a new branch for your changes:

   ```bash
   git checkout -b feature/your-feature
   ```

3. Make your changes, ensuring they adhere to the project's [code style](#code-style).
4. Commit your changes using [conventional commit messages](https://www.conventionalcommits.org/en/v1.0.0/), such as:

   ```bash
   feat(commands): added the new 'ping' command
   ```

5. Push your branch to your forked repository:

   ```bash
   git push origin feature/your-feature
   ```

6. Open a pull request on the original repository. Provide a clear description of the changes, and reference any relevant issues.

## Code Style

- Use TypeScript for all new code.
- We use a **2-space indent** in the codebase.
- Use `Biome` to ensure consistent code quality and formatting:

## Branching and Pull Requests

- Create feature branches from `main` for any new features or bug fixes.
- Keep your branch up to date with `main` by rebasing or merging before creating a pull request.
- Each pull request should include:
  - A descriptive title
  - A detailed description of the changes
  - Reference to related issue(s) if applicable
  - Testing steps

## Testing

If you're adding new features or modifying existing functionality, please write unit tests to cover your changes.

- We use [Bun Test](https://bun.sh/docs/cli/test) for testing.
- Run tests locally using:

  ```bash
  bun test
  ```

- Add new tests for any new or modified functionality.

## Issues

When submitting an issue, please include:

- A clear and descriptive title.
- Detailed steps to reproduce the issue.
- Any relevant log output or screenshots.

## License

By contributing to this project, you agree that your contributions will be licensed under the project's [MIT License](./LICENSE).
