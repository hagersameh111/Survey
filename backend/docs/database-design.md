Collections

1. users
- _id
- firstName
- lastName
- email
- password
- role
- isVerified
- avatar
- createdAt
- updatedAt

--------------------------------

2. surveys
- _id
- owner (User)
- title
- description
- status
- questions []
- settings {}
- createdAt
- updatedAt

--------------------------------

3. responses
- _id
- survey
- answers []
- submittedAt

--------------------------------

4. shortLinks
- _id
- survey
- shortCode
- createdAt