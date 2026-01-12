// Utility to generate course content based on course title
export interface ModuleContent {
  title: string
  content: string
}

export function generateCourseModules(courseTitle: string): ModuleContent[] {
  const titleLower = courseTitle.toLowerCase()
  
  // Generate modules based on course title keywords
  if (titleLower.includes('react') || titleLower.includes('frontend')) {
    return [
      {
        title: "Introduction to React",
        content: `# Introduction to React

Welcome to ${courseTitle}! In this first module, we'll explore the fundamentals of React.

## What is React?

React is a JavaScript library for building user interfaces, particularly web applications. It was developed by Facebook and is now maintained by Facebook and the community.

## Key Concepts

- **Components**: React applications are built using reusable components
- **JSX**: A syntax extension that allows you to write HTML-like code in JavaScript
- **Props**: Data passed from parent to child components
- **State**: Component-specific data that can change over time

## Getting Started

To create a new React application, you can use Create React App:

\`\`\`bash
npx create-react-app my-app
cd my-app
npm start
\`\`\`

## Your First Component

Here's a simple React component:

\`\`\`jsx
function Welcome() {
  return <h1>Hello, World!</h1>;
}
\`\`\`

## Practice Exercise

Create a simple component that displays your name. Try to make it interactive by adding a button that changes the displayed text.

## Next Steps

In the next module, we'll dive deeper into component lifecycle and state management.`
      },
      {
        title: "Components and Props",
        content: `# Components and Props

In this module, we'll learn how to create reusable components and pass data using props.

## Understanding Components

Components are the building blocks of React applications. They let you split the UI into independent, reusable pieces.

## Functional Components

Modern React primarily uses functional components:

\`\`\`jsx
function Greeting(props) {
  return <h1>Hello, {props.name}!</h1>;
}
\`\`\`

## Props

Props (short for properties) are read-only. They allow you to pass data from parent to child components.

## Component Composition

You can compose components together:

\`\`\`jsx
function App() {
  return (
    <div>
      <Greeting name="Alice" />
      <Greeting name="Bob" />
    </div>
  );
}
\`\`\`

## Best Practices

- Keep components small and focused
- Use descriptive prop names
- Validate props with PropTypes or TypeScript

## Practice Exercise

Create a Card component that accepts title, description, and image props. Use it to display multiple cards in a grid layout.`
      },
      {
        title: "State and Hooks",
        content: `# State and Hooks

Learn how to manage component state using React Hooks.

## What is State?

State is data that can change over time. When state changes, React re-renders the component.

## useState Hook

The useState hook lets you add state to functional components:

\`\`\`jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}
\`\`\`

## useEffect Hook

The useEffect hook lets you perform side effects:

\`\`\`jsx
import { useState, useEffect } from 'react';

function Timer() {
  const [seconds, setSeconds] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(seconds => seconds + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return <div>Timer: {seconds}s</div>;
}
\`\`\`

## Practice Exercise

Build a todo list application where users can add, remove, and mark tasks as complete.`
      },
      {
        title: "Advanced Patterns",
        content: `# Advanced React Patterns

Explore advanced patterns and best practices for building scalable React applications.

## Custom Hooks

Create reusable logic with custom hooks:

\`\`\`jsx
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });
  
  const setValue = (value) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(error);
    }
  };
  
  return [storedValue, setValue];
}
\`\`\`

## Context API

Share data across components without prop drilling:

\`\`\`jsx
const ThemeContext = createContext();

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Toolbar />
    </ThemeContext.Provider>
  );
}
\`\`\`

## Performance Optimization

- Use React.memo for component memoization
- Implement useMemo and useCallback for expensive operations
- Code splitting with React.lazy

## Practice Exercise

Refactor your todo app to use Context API for state management and add custom hooks for data persistence.`
      }
    ]
  } else if (titleLower.includes('python') || titleLower.includes('programming')) {
    return [
      {
        title: "Python Basics",
        content: `# Python Basics

Welcome to ${courseTitle}! Let's start with the fundamentals of Python programming.

## What is Python?

Python is a high-level, interpreted programming language known for its simplicity and readability. It's widely used in web development, data science, AI, and automation.

## Your First Program

\`\`\`python
print("Hello, World!")
\`\`\`

## Variables and Data Types

Python has several built-in data types:

\`\`\`python
# Numbers
age = 25
price = 19.99

# Strings
name = "Python"

# Lists
fruits = ["apple", "banana", "orange"]

# Dictionaries
person = {"name": "John", "age": 30}
\`\`\`

## Control Flow

\`\`\`python
if age >= 18:
    print("You are an adult")
else:
    print("You are a minor")
\`\`\`

## Practice Exercise

Write a program that asks for a user's name and age, then prints a personalized greeting.`
      },
      {
        title: "Functions and Modules",
        content: `# Functions and Modules

Learn how to organize your code with functions and modules.

## Defining Functions

\`\`\`python
def greet(name):
    return f"Hello, {name}!"

print(greet("Alice"))
\`\`\`

## Function Parameters

\`\`\`python
def calculate_total(price, tax_rate=0.1):
    return price * (1 + tax_rate)

total = calculate_total(100)
print(total)  # 110.0
\`\`\`

## Working with Modules

\`\`\`python
import math
from datetime import datetime

print(math.sqrt(16))  # 4.0
print(datetime.now())
\`\`\`

## Practice Exercise

Create a module with utility functions for string manipulation (reverse, capitalize, count words).`
      },
      {
        title: "Data Structures",
        content: `# Python Data Structures

Master lists, dictionaries, tuples, and sets.

## Lists

\`\`\`python
numbers = [1, 2, 3, 4, 5]
numbers.append(6)
numbers.remove(2)
print(numbers)  # [1, 3, 4, 5, 6]
\`\`\`

## Dictionaries

\`\`\`python
student = {
    "name": "Alice",
    "age": 20,
    "grades": [85, 90, 88]
}

print(student["name"])
student["major"] = "Computer Science"
\`\`\`

## List Comprehensions

\`\`\`python
squares = [x**2 for x in range(10)]
print(squares)  # [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]
\`\`\`

## Practice Exercise

Create a program that manages a contact book using dictionaries. Add, search, and delete contacts.`
      },
      {
        title: "Object-Oriented Programming",
        content: `# Object-Oriented Programming in Python

Learn to create classes and objects.

## Defining Classes

\`\`\`python
class Dog:
    def __init__(self, name, breed):
        self.name = name
        self.breed = breed
    
    def bark(self):
        return f"{self.name} says Woof!"

my_dog = Dog("Buddy", "Golden Retriever")
print(my_dog.bark())
\`\`\`

## Inheritance

\`\`\`python
class Animal:
    def __init__(self, name):
        self.name = name
    
    def speak(self):
        pass

class Cat(Animal):
    def speak(self):
        return f"{self.name} says Meow!"
\`\`\`

## Practice Exercise

Create a banking system with Account, SavingsAccount, and CheckingAccount classes.`
      }
    ]
  } else if (titleLower.includes('javascript') || titleLower.includes('js')) {
    return [
      {
        title: "JavaScript Fundamentals",
        content: `# JavaScript Fundamentals

Welcome to ${courseTitle}! Let's master the core concepts of JavaScript.

## What is JavaScript?

JavaScript is a versatile programming language that powers interactive web pages. It's the only programming language native to web browsers.

## Variables and Constants

\`\`\`javascript
let name = "JavaScript";
const PI = 3.14159;
var oldWay = "avoid this";
\`\`\`

## Data Types

\`\`\`javascript
// Primitive types
let number = 42;
let string = "Hello";
let boolean = true;
let nullValue = null;
let undefinedValue = undefined;

// Objects
let person = {
  name: "John",
  age: 30
};
\`\`\`

## Practice Exercise

Create variables for your name, age, and favorite programming language. Display them using console.log().`
      },
      {
        title: "Functions and Scope",
        content: `# Functions and Scope

Understand how functions work in JavaScript.

## Function Declarations

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

## Arrow Functions

\`\`\`javascript
const add = (a, b) => a + b;
const square = x => x * x;
\`\`\`

## Scope

\`\`\`javascript
let global = "I'm global";

function testScope() {
  let local = "I'm local";
  console.log(global); // Works
}

console.log(local); // Error!
\`\`\`

## Practice Exercise

Write functions to calculate the area of a circle, rectangle, and triangle.`
      },
      {
        title: "Arrays and Objects",
        content: `# Arrays and Objects

Master working with complex data structures.

## Arrays

\`\`\`javascript
let fruits = ["apple", "banana", "orange"];
fruits.push("grape");
fruits.forEach(fruit => console.log(fruit));

// Array methods
let numbers = [1, 2, 3, 4, 5];
let doubled = numbers.map(n => n * 2);
let evens = numbers.filter(n => n % 2 === 0);
\`\`\`

## Objects

\`\`\`javascript
let car = {
  make: "Toyota",
  model: "Camry",
  year: 2023,
  start: function() {
    return "Engine started!";
  }
};
\`\`\`

## Practice Exercise

Create an array of student objects with name, grade, and subjects. Filter students with grades above 80.`
      },
      {
        title: "Async JavaScript",
        content: `# Asynchronous JavaScript

Learn promises, async/await, and handling asynchronous operations.

## Promises

\`\`\`javascript
fetch('https://api.example.com/data')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error(error));
\`\`\`

## Async/Await

\`\`\`javascript
async function fetchData() {
  try {
    const response = await fetch('https://api.example.com/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
  }
}
\`\`\`

## Practice Exercise

Create a function that fetches user data from an API and displays it. Handle loading and error states.`
      }
    ]
  } else {
    // Generic course content
    return [
      {
        title: "Introduction",
        content: `# Introduction to ${courseTitle}

Welcome to ${courseTitle}! This course will provide you with comprehensive knowledge and practical skills.

## Course Overview

In this course, you'll learn:
- Fundamental concepts and principles
- Best practices and industry standards
- Hands-on practical applications
- Real-world problem-solving techniques

## Learning Objectives

By the end of this course, you will be able to:
1. Understand core concepts
2. Apply knowledge in practical scenarios
3. Solve complex problems
4. Build real-world projects

## Getting Started

Let's begin your learning journey! Make sure to complete each module in order and practice the exercises provided.`
      },
      {
        title: "Core Concepts",
        content: `# Core Concepts

In this module, we'll explore the fundamental concepts that form the foundation of ${courseTitle}.

## Key Concepts

Understanding these core concepts is essential for mastering the subject:

1. **Concept One**: The fundamental principle that guides everything
2. **Concept Two**: Building upon the first concept
3. **Concept Three**: Advanced applications

## Practical Application

Let's see how these concepts work in practice:

\`\`\`
Example code or demonstration here
\`\`\`

## Practice Exercise

Apply what you've learned by completing the exercise at the end of this module.`
      },
      {
        title: "Advanced Topics",
        content: `# Advanced Topics

Now that you understand the basics, let's dive into more advanced topics.

## Advanced Techniques

We'll cover:
- Advanced patterns and methodologies
- Optimization strategies
- Best practices from industry experts

## Real-World Applications

See how these advanced concepts are applied in real-world scenarios.

## Practice Exercise

Challenge yourself with this advanced exercise that combines multiple concepts.`
      },
      {
        title: "Project and Conclusion",
        content: `# Final Project and Conclusion

Congratulations on reaching the final module! Let's put everything together.

## Final Project

Your final project will demonstrate your mastery of all concepts covered in this course.

## Project Requirements

- Apply all learned concepts
- Demonstrate best practices
- Create a complete, working solution

## Course Conclusion

You've completed ${courseTitle}! Review the key takeaways and continue practicing to master these skills.`
      }
    ]
  }
}
