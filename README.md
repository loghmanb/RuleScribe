# RuleScribe (Typescript rule engine)

RuleScribe is a lightweight and powerful rule engine for JavaScript and TypeScript applications. It allows you to define and execute business rules in a declarative manner, enabling agile decision-making and automation of complex logic.

## Installation

You can install RuleScribe via npm:

```bash
npm install rulescribe
```

## Usage

### Define a Simple Rule

To define a simple rule using RuleScribe, follow these steps:

1. Import the required modules:

    ```typescript
    import { Engine, Lexer, EngineScope } from "rulescribe";
    ```

2. Define the structure of the entity for which you're defining rules. For example, let's define a `Patient` type:

    ```typescript
    type Patient = {
        name: string;
        lastVisit: number;
    }
    ```

3. Define a method to perform an action based on the rule. For example, let's define a method to send a checkup reminder SMS to a patient:

    ```typescript
    const sendCheckupReminderSMS = (patient: Patient) => {
        // Your business logic to send SMS goes here.
    }
    ```

4. Write the rule:

    ```typescript
    const rule = `
    Rule "My First Rule"
    When patient.lastVisit > 90
    Then
        sendCheckupReminderSMS(patient)
    End
    ```

5. Set up the RuleScribe engine and execute the rule:

    ```typescript
    const scope = new EngineScope();
    scope.builtinFunction.set("sendCheckupReminderSMS", {
        func:  sendCheckupReminderSMS
    });

    const lexer = new Lexer(rule, scope);
    const engine = new Engine(lexer);

    // Define the patient
    scope.define('patient', { name: "John Doe", lastVisit: 100 });

    // Parse and execute the rule
    await engine.parse(scope);
    await engine.fire(scope);
    ```

This code will execute the rule "My First Rule" and send a checkup reminder SMS to the patient if their last visit was more than 90 days ago.

## Documentation

For more information on how to use RuleScribe, including advanced features and usage examples, refer to the [RuleScribe Wiki](https://github.com/loghmanb/rulescribe/wiki).

## Contributing

Contributions are welcome! If you encounter any issues or have suggestions for improvements, please feel free to open an issue or submit a pull request.

## License

This project is licensed under the [MIT License](https://github.com/loghmanb/rulescribe/blob/main/LICENSE).

