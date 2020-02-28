/* eslint-disable no-undef */

const { ApolloServer, gql } = require('apollo-server')
const uuid = require('uuid/v1')

let authors = [
	{
		name: 'Robert Martin',
		id: 'afa51ab0-344d-11e9-a414-719c6709cf3e',
		born: 1952,
	},
	{
		name: 'Martin Fowler',
		id: 'afa5b6f0-344d-11e9-a414-719c6709cf3e',
		born: 1963
	},
	{
		name: 'Fyodor Dostoevsky',
		id: 'afa5b6f1-344d-11e9-a414-719c6709cf3e',
		born: 1821
	},
	{ 
		name: 'Joshua Kerievsky', // birthyear not known
		id: 'afa5b6f2-344d-11e9-a414-719c6709cf3e',
	},
	{ 
		name: 'Sandi Metz', // birthyear not known
		id: 'afa5b6f3-344d-11e9-a414-719c6709cf3e',
	},
]

/*
 * Saattaisi olla järkevämpää assosioida kirja ja sen tekijä tallettamalla kirjan yhteyteen tekijän nimen sijaan tekijän id
 * Yksinkertaisuuden vuoksi tallennamme kuitenkin kirjan yhteyteen tekijän nimen
*/

let books = [
	{
		title: 'Clean Code',
		published: 2008,
		author: 'Robert Martin',
		id: 'afa5b6f4-344d-11e9-a414-719c6709cf3e',
		genres: ['refactoring']
	},
	{
		title: 'Agile software development',
		published: 2002,
		author: 'Robert Martin',
		id: 'afa5b6f5-344d-11e9-a414-719c6709cf3e',
		genres: ['agile', 'patterns', 'design']
	},
	{
		title: 'Refactoring, edition 2',
		published: 2018,
		author: 'Martin Fowler',
		id: 'afa5de00-344d-11e9-a414-719c6709cf3e',
		genres: ['refactoring']
	},
	{
		title: 'Refactoring to patterns',
		published: 2008,
		author: 'Joshua Kerievsky',
		id: 'afa5de01-344d-11e9-a414-719c6709cf3e',
		genres: ['refactoring', 'patterns']
	},  
	{
		title: 'Practical Object-Oriented Design, An Agile Primer Using Ruby',
		published: 2012,
		author: 'Sandi Metz',
		id: 'afa5de02-344d-11e9-a414-719c6709cf3e',
		genres: ['refactoring', 'design']
	},
	{
		title: 'Crime and punishment',
		published: 1866,
		author: 'Fyodor Dostoevsky',
		id: 'afa5de03-344d-11e9-a414-719c6709cf3e',
		genres: ['classic', 'crime']
	},
	{
		title: 'The Demon ',
		published: 1872,
		author: 'Fyodor Dostoevsky',
		id: 'afa5de04-344d-11e9-a414-719c6709cf3e',
		genres: ['classic', 'revolution']
	},
]

const typeDefs = gql`
	type Book {
		title: String!
		author: String!
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
		allBooks(author: String, genre: String): [Book!]!
		allAuthors: [Author!]!
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
	}
`

const resolvers = {
	Query: {
		bookCount: () => books.length,
		authorCount: () => authors.length,
		allBooks: (root, args) => {
			let result = books
			if (args.author) result = result.filter(b => b.author === args.author)
			if (args.genre) result = result.filter(b => b.genres.includes(args.genre))
			return result
		},
		allAuthors: () => authors
	},
	Mutation: {
		addBook: (root, args) => {
			const book = { ...args, id: uuid() }
			if (!authors.find(a => a.name === args.author)) {
				authors = authors.concat({ name:args.author, id: uuid() })
			}
			books = books.concat(book)
			console.log(books)
			return book
		},
		editAuthor: (root, args) => {
			if (!authors.find(a => a.name === args.name)) {
				return null
			}
			const author = { name: args.name, born: args.setBornTo }
			authors = authors.concat(author)
			return author
		}
	},
	Author: {
		bookCount: (root) => {
			const authorsBooks = books.filter(b => b.author === root.name)
			console.log(authorsBooks)
			return authorsBooks.length
		}
	}
	
}

const server = new ApolloServer({
	typeDefs,
	resolvers,
})

server.listen().then(({ url }) => {
	console.log(`Server ready at ${url}`)
})