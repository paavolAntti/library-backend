/* eslint-disable no-undef */

require('dotenv').config()
const { ApolloServer, gql, UserInputError } = require('apollo-server')
const mongoose = require('mongoose')
const Book = require('./models/book')
const Author = require('./models/author')
const User = require('./models/user')
const jwt = require('jsonwebtoken')

mongoose.set('useFindAndModify', false)
mongoose.set('useCreateIndex', true)
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
	.then(() => {
		console.log('connected to MongoDB')
	})
	.catch((error) => {
		console.log('error connecting to MongoDB: ', error.message)
	})


const typeDefs = gql`
	type User {
		username: String!
		favoriteGenre: String!
		id: ID!
	}
	type Token {
		value: String!
	}
	type Book {
		title: String!
		author: Author!
		published: Int!
		genres: [String]
		id: ID!
	}
	type Author {
		name: String!
		born: Int
		id: ID!
		bookCount: Int
	}
	type Query {
		bookCount: Int!
		authorCount: Int!
		allBooks(author: String, genre: String): [Book]
		allAuthors: [Author!]!
		allGenres: [String]
		me: User
	}
	type Mutation {
		addBook(
			title: String!
			author: String!
			published: Int!
			genres: [String]
		): Book
		editAuthor(
			name: String!
			setBornTo: Int!
		): Author
		createUser(
			username: String!
			favoriteGenre: String!
		): User
		login(
			username: String!
			password: String!
		): Token
	}
`

const resolvers = {
	Query: {
		bookCount: () => Book.collection.countDocuments(),
		authorCount: () => Author.collection.countDocuments(),
		allBooks: async (root, args) => {
			let result
			if (!args.author && !args.genre) {
				return await Book.find({}).populate('author')
			}
			if (args.author) {
				const author = await Author.find({ name: args.author })
				console.log('author: ', author)
				result = await Book.find({ author: author._id }).populate('author')
				console.log('result', result)
			} 
			if (args.genre) {
				result = await Book.find({ genres: { $in:[args.genre] } }).populate('author')
				console.log('result:', result)
			} 

			return result
		},
		allAuthors: async () => { 
			return await Author.find({})
		},
		me: (root, args, context) => {
			return context.currentUser
		},
		allGenres: async () => {
			let genres = []
			const books = await Book.find({})
			books.map(b => b.genres.forEach(element => {
				genres.push(element)
			}))
			return [...new Set(genres)]
		}
	},
	Mutation: {
		addBook: async (root, args, context) => {
			const currentUser = context.currentUser
			if (!currentUser) {
				throw new AuthenticationError('No authorization to add a book')
			}
			let author = await Author.findOne({ name: args.author })
			if (!author) {
				author = new Author({ name: args.author })
				try {
					await author.save()
				} catch (error) {
					throw new UserInputError(error.message, {
						invalidArgs: args,
					})
				}
				
			} 
			
			const book = new Book({...args, author: author.id })
			try {
				await book.save()
			} catch (error) {
				throw new UserInputError(error.message, {
					invalidArgs: args,
				})
			}
			
			return await Book.findById(book.id).populate('author')
			
		},
		editAuthor: async (root, args, context) => {
			const currentUser = context.currentUser
			if (!currentUser) {
				throw new AuthenticationError('No authorization to add a book')
			}
			const author = await Author.findOne({ name: args.name })
			if (!author) {
				return null
			}
			author.born = args.setBornTo
			return author.save()
		},
		createUser: async (root, args) => {
			const user = await new User({ username: args.username, favoriteGenre: args.favoriteGenre })
			try {
				await user.save()
			} catch (error) {
				throw new UserInputError(error.message, {
					invalidArgs: args,
				})
			}
			return user
		},
		login: async (root, args) => {
			const user = await User.findOne({ username: args.username })
			console.log(user)
			if (!user || args.password !== 'salasana') {
				throw new UserInputError('wrong credentials')
			}

			const userForToken = {
				username: user.username,
				id: user._id
			}
			return { value: jwt.sign(userForToken, process.env.JWT_SECRET) }
		}
	},
	Author: {
		bookCount: (root) => {
			const authorsBooks = Book.find({ author: root.id })
			console.log(authorsBooks)
			return authorsBooks.countDocuments()
		}
	},
}

const server = new ApolloServer({
	typeDefs,
	resolvers,
	context: async ({ req }) => {
		const auth = req ? req.headers.authorization : null
		if (auth && auth.toLocaleLowerCase().startsWith('bearer')) {
			const decodedToken = jwt.verify(
				auth.substring(7), process.env.JWT_SECRET
			)
			const currentUser = await User.findById(decodedToken.id)
			return { currentUser }
		}
	}
})

server.listen().then(({ url }) => {
	console.log(`Server ready at ${url}`)
})