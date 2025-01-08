// @flow
import Router from '@koa/router';

// In-memory storage for comments (for stored XSS demo)
const comments = [];

const router = new Router();

// Reflected XSS endpoint - search functionality
router.get('/api/search', async (ctx) => {
    const query = ctx.query.q || '';
    // Vulnerable: directly reflecting user input without sanitization
    ctx.body = {
        results: [],
        searchHeader: query,
        rawHtml: `
            <div>
                <h4>Search Results</h4>
                <script>
                    // Existing scripts will be preserved
                    window.onload = function() {
                        // Your search query was:
                        ${query}
                    }
                </script>
                <p>You searched for: ${query}</p>
            </div>
        `
    };
});

// Stored XSS endpoint - comments functionality
router.post('/api/comments', async (ctx) => {
    const { comment, author } = ctx.request.body;
    // Vulnerable: storing raw user input
    comments.push({
        comment,
        author,
        rawHtml: `
            <div class="comment">
                <script>
                    // Existing scripts will be preserved
                    console.log("Loading comment by: ${author}");
                    ${comment}  // Directly inject the comment as JS
                </script>
                <strong>${author}</strong> says:
                <p>${comment}</p>
            </div>
        `,
        date: new Date().toISOString()
    });
    ctx.body = { status: 'success' };
});

router.get('/api/comments', async (ctx) => {
    // Vulnerable: returning stored raw user input
    ctx.body = comments;
});

export default router.routes();
