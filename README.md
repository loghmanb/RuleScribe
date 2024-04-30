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
    `
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

### Support RuleScribe Development

RuleScribe is an open-source project driven by a community of passionate developers and contributors. Your support can help ensure the continued growth and improvement of RuleScribe, enabling us to deliver innovative features, maintain compatibility with the latest technologies, and provide ongoing support to users.

#### How You Can Help:

1. **Financial Contributions:** Consider making a financial contribution to support RuleScribe development. Your donations help cover expenses such as server hosting, development tools, and community outreach efforts.

2. **Sponsorship Opportunities:** Explore sponsorship opportunities to showcase your organization's commitment to open-source software and innovation. Sponsorship packages may include recognition on our website, social media shoutouts, and other promotional benefits.

3. **Contributions and Feedback:** Get involved in the RuleScribe community by contributing code, reporting bugs, and providing feedback on features and enhancements. Your input helps shape the future direction of the project.

#### Get in Touch:

To learn more about how you can support RuleScribe development or inquire about sponsorship opportunities, please contact us at [loghmanb@gmail.com](mailto:loghmanb@gmail.com). We appreciate your support and look forward to collaborating with you to make RuleScribe even better!

## License

This project is licensed under the [MIT License](https://github.com/loghmanb/rulescribe/blob/main/LICENSE).

