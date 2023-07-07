# Contributing to Massa Standard Definition

Thank you for your interest in contributing to the Massa Standard Definition project!

This project is open to contributions from anyone in the Massa community, and we welcome your input.

Thank you for considering contributing to massa-standards!

## Reporting Bugs

If you discover a bug, please create a [new issue](https://github.com/massalabs/massa-standards/issues/new?assignees=&labels=issue%3Abug&projects=&template=bug.md&title=) on our GitHub repository.

In your issue, please include a clear and concise description of the bug, any relevant code snippets, error messages, and steps to reproduce the issue.

## Contributing Code

To get started with contributing to the project, please follow these steps:

1. Fork the repository on GitHub.
2. Clone the forked repository to your local machine.
3. Create a new branch for your changes.
4. Make your changes and commit them to your branch.
5. Push your branch to your forked repository on GitHub.
6. Create a pull request to merge your changes into the main repository.

## Guidelines

When contributing to the project, please follow these guidelines:

- Use clear and concise language in your code and documentation.
- Ensure that your code is well-structured and easy to read.
- Be respectful and professional in your interactions with other contributors.

## Code style
Please ensure that your code follows the existing code style used in the project.

For smart contract, ensure that your code follows the existing code style used in the project. We use the [MassaLabs Prettier configuration](https://github.com/massalabs/prettier-config-as) and [MassaLabs ESLint configuration](https://github.com/massalabs/eslint-config) for formatting and linting.

You can run the following command to format your code before committing:

```sh
npm run fmt
```

## Tests

Please ensure that your changes include any necessary tests.
  
You can run the following command to run the smart-contracts tests:

```sh
npm run build
```

and then

```sh
npm run test
```
## Template

Please use the following template when starting a new standard document (see [example](wallet/dapps-communication.md)):

```markdown
# Name

**Authors:** 

**Status:** Draft, Effective or Deprecated

**Version:** 0.1

## Abstract

## Targeted Audience

## Specification

## Implementation

```

## License

By contributing to massa standard, you agree that your contributions will be licensed under the MIT License.
