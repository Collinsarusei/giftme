// Run this in your browser console or create as a script

// Add your previous user data
const testUser = {
  id: Date.now().toString(),
  username: "your-previous-username", // Replace with your username
  email: "your-previous-email@example.com", // Replace with your email
  createdAt: new Date().toISOString(),
  events: [],
}

// Get existing users or create empty array
const users = JSON.parse(localStorage.getItem("users") || "[]")

// Add your user
users.push(testUser)

// Save back to localStorage
localStorage.setItem("users", JSON.stringify(users))

console.log("✅ User added successfully!")
console.log("You can now login with:", testUser.username, testUser.email)
