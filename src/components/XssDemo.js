import React, { useEffect, useState } from 'react';

export default function XssDemo() {
    const [searchQuery, setSearchQuery] = useState('');
    const [comment, setComment] = useState('');
    const [author, setAuthor] = useState('');
    const [comments, setComments] = useState([]);

    // DOM XSS: Vulnerable function that processes URL fragment
    useEffect(() => {
        // Initial load
        processHash();

        // Add event listener for hash changes
        const handleHashChange = () => {
            processHash();
        };

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const processHash = () => {
        const hashContent = window.location.hash.slice(1);
        if (hashContent) {
            const decodedContent = decodeURIComponent(hashContent);
            // Create a new div and set its content
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = decodedContent;

            // Get the hash-content div
            const container = document.getElementById('hash-content');
            if (container) {
                // Clear existing content
                container.innerHTML = '';
                // Add new content
                container.appendChild(tempDiv);

                // Execute any scripts in the content
                const scripts = tempDiv.getElementsByTagName('script');
                Array.from(scripts).forEach(script => {
                    const newScript = document.createElement('script');
                    newScript.text = script.textContent;
                    document.body.appendChild(newScript);
                });
            }
        }
    };

    // Reflected XSS: Search function
    const handleSearch = async (e) => {
        e.preventDefault();
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();

        // Create a new div for the search results
        const searchDiv = document.createElement('div');
        searchDiv.innerHTML = data.rawHtml;

        // Replace the entire search-results content
        const resultsContainer = document.getElementById('search-results');
        resultsContainer.innerHTML = ''; // Clear existing content
        resultsContainer.appendChild(searchDiv);

        // Execute any scripts in the response
        const scripts = searchDiv.getElementsByTagName('script');
        for (let script of scripts) {
            const newScript = document.createElement('script');
            newScript.text = script.text;
            document.body.appendChild(newScript);
        }
    };

    // Stored XSS: Comment functions
    const submitComment = async (e) => {
        e.preventDefault();
        await fetch('/api/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ comment, author })
        });
        loadComments();
        setComment('');
        setAuthor('');
    };

    const loadComments = async () => {
        const response = await fetch('/api/comments');
        const data = await response.json();
        setComments(data);

        // Execute any scripts in the comments
        setTimeout(() => {
            const commentScripts = document.querySelectorAll('.comment script');
            for (let script of commentScripts) {
                const newScript = document.createElement('script');
                newScript.text = script.text;
                document.body.appendChild(newScript);
            }
        }, 100);
    };

    useEffect(() => {
        loadComments();
    }, []);

    return (
        <div>
            <h2>XSS Vulnerability Demo</h2>

            {/* DOM-based XSS Demo - Moving this section to the top */}
            <section>
                <h3>DOM-based XSS - URL Fragment</h3>
                <div id="hash-content"></div>
                <p>Try these examples:</p>
                <ul>
                    <li><code>#&lt;img src=x onerror="alert('dom xss')"&gt;</code></li>
                    <li><code>#&lt;script&gt;alert('dom xss')&lt;/script&gt;</code></li>
                </ul>
            </section>

            {/* Reflected XSS Demo */}
            <section>
                <h3>Reflected XSS - Search</h3>
                <form onSubmit={handleSearch}>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search..."
                    />
                    <button type="submit">Search</button>
                </form>
                <div id="search-results"></div>
            </section>

            {/* Stored XSS Demo */}
            <section>
                <h3>Stored XSS - Comments</h3>
                <form onSubmit={submitComment}>
                    <input
                        type="text"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        placeholder="Your name"
                    />
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Your comment"
                    />
                    <button type="submit">Post Comment</button>
                </form>
                <div>
                    {comments.map((c, i) => (
                        <div key={i} dangerouslySetInnerHTML={{ __html: c.rawHtml }} />
                    ))}
                </div>
            </section>
        </div>
    );
}
