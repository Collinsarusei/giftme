// Run this in browser console to add sample data

// Sample users
const sampleUsers = [
  {
    id: "1",
    username: "john_doe",
    email: "john@example.com",
    createdAt: new Date().toISOString(),
    events: [],
  },
  {
    id: "2",
    username: "jane_smith",
    email: "jane@example.com",
    createdAt: new Date().toISOString(),
    events: [],
  },
]

// Sample events
const sampleEvents = [
  {
    id: "john-doe-birthday-" + Date.now(),
    name: "John's 25th Birthday",
    type: "Birthday",
    date: "2024-02-15",
    mpesaNumber: "254708374149",
    description: "Celebrating another year of life!",
    images: [],
    raised: 2500,
    goal: 10000,
    currency: "KES",
    giftCount: 5,
    views: 23,
    shares: 3,
    createdAt: new Date().toISOString(),
    creatorName: "John Doe",
    createdBy: "john_doe",
    gifts: [
      {
        id: "gift1",
        from: "Alice",
        email: "alice@example.com",
        amount: 500,
        currency: "KES",
        message: "Happy birthday!",
        timestamp: new Date().toISOString(),
        paymentMethod: "mpesa",
        status: "completed",
      },
    ],
    status: "active",
  },
]

// Save to localStorage
localStorage.setItem("users", JSON.stringify(sampleUsers))
localStorage.setItem("allEvents", JSON.stringify(sampleEvents))

console.log("✅ Sample data added!")
console.log("Login credentials:")
console.log("Username: john_doe, Email: john@example.com")
console.log("Username: jane_smith, Email: jane@example.com")
