import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ProblemList from './ProblemList'; 
import Workspace from './Workspace';

const httpLink = new HttpLink({ uri: 'http://localhost:5000/graphql' });

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});

export default function App() {
  return (
    <ApolloProvider client={client}>
      <Router>
        <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
          
          {/* Global Navbar */}
          <header className="h-14 border-b border-neutral-800 flex items-center px-6 bg-neutral-900 shadow-sm">
            <Link to="/" className="text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              Online Judge
            </Link>
          </header>

          {/* Router Viewport */}
          <main className="flex-grow flex flex-col">
            <Routes>
              <Route path="/" element={<ProblemList />} />
              <Route path="/problem/:id" element={<Workspace />} />
            </Routes>
          </main>
          
        </div>
      </Router>
    </ApolloProvider>
  );
}