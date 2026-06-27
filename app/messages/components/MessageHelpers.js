// app/messages/components/MessageHelpers.js
// ✅ FIXED - Better keyword detection with regex patterns

const MessageHelpers = {
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    },

    getUnreadCount(conversations) {
        return conversations.reduce((count, chat) => count + (chat.unreadCount || 0), 0);
    },

    /**
     * ✅ IMPROVED keyword detection with regex patterns
     * Properly filters false positives
     */
    hasSwapKeywords(message) {
        if (!message || typeof message !== 'string') {
            console.log('❌ Invalid message type');
            return false;
        }

        const lowerMessage = message.toLowerCase().trim();
        console.log('🔍 Keyword check:', `"${message}"`);

        // STEP 1: Filter false positives using REGEX
        const falsePositivePatterns = [
            /trading\s+cards?/i,
            /trade\s+cards?/i,
            /pokemon/i,
            /crypto(currency)?/i,
            /stock\s+(exchange|market|trade|trading)/i,
            /(money|currency|foreign)\s+exchange/i,
            /exchange\s+rate/i,
            /heat\s+exchange/i,
            /data\s+exchange/i,
            /file\s+exchange/i,
        ];

        for (const pattern of falsePositivePatterns) {
            if (pattern.test(lowerMessage)) {
                console.log('🚫 False positive blocked:', pattern);
                return false;
            }
        }

        // STEP 2: Check for swap keywords
        const swapKeywords = [
            // Core single words (with word boundaries)
            /\bswap\b/i,
            /\bexchange\b/i,
            /\btrade\b/i,
            /\bshare\b/i,
            
            // Common phrases
            /skill\s*swap/i,
            /skills?\s*exchange/i,
            /skills?\s*trade/i,
            /share\s*skills?/i,
            
            // Intent phrases
            /let'?s\s+swap/i,
            /wann?a\s+swap/i,
            /want\s+to\s+swap/i,
            /can\s+we\s+swap/i,
            /let'?s\s+exchange/i,
            /wann?a\s+exchange/i,
            /want\s+to\s+exchange/i,
            /can\s+we\s+exchange/i,
            /let'?s\s+trade/i,
            /wann?a\s+trade/i,
            /want\s+to\s+trade/i,
            /can\s+we\s+trade/i,
            
            // Professional terms
            /professional\s+(swap|exchange|trade)/i,
            /mutual\s+(learning|teaching|exchange)/i,
            /knowledge\s+(swap|exchange|sharing)/i,
        ];

        // Check each pattern
        for (const pattern of swapKeywords) {
            if (pattern.test(lowerMessage)) {
                console.log('✅ MATCH:', pattern);
                return true;
            }
        }

        console.log('❌ No keyword match');
        return false;
    },

    /**
     * 🧪 Test function - Run in console: MessageHelpers.testKeywords()
     */
    testKeywords() {
        console.log('\n🧪 TESTING KEYWORD DETECTION\n' + '='.repeat(60));
        
        const tests = [
            // Should MATCH
            { msg: "swap", expected: true },
            { msg: "exchange", expected: true },
            { msg: "trade", expected: true },
            { msg: "share", expected: true },
            { msg: "wanna swap", expected: true },
            { msg: "let's exchange skills", expected: true },
            { msg: "skill swap", expected: true },
            { msg: "SWAP", expected: true },
            { msg: "Can we trade knowledge?", expected: true },
            { msg: "Professional exchange", expected: true },
            
            // Should NOT match
            { msg: "trading cards", expected: false },
            { msg: "I love trading cards", expected: false },
            { msg: "stock exchange", expected: false },
            { msg: "hello", expected: false },
            { msg: "pokemon trade", expected: false },
            { msg: "crypto exchange", expected: false },
            { msg: "exchange rate", expected: false },
        ];

        let passed = 0;
        let failed = 0;

        tests.forEach((test, i) => {
            console.log(`\n--- Test ${i + 1} ---`);
            const result = this.hasSwapKeywords(test.msg);
            const status = result === test.expected ? '✅ PASS' : '❌ FAIL';
            
            if (result === test.expected) passed++;
            else failed++;

            console.log(`${status} | "${test.msg}"`);
            console.log(`Expected: ${test.expected}, Got: ${result}`);
        });

        console.log('\n' + '='.repeat(60));
        console.log(`📊 Results: ${passed}/${tests.length} passed, ${failed} failed`);
        console.log('='.repeat(60) + '\n');

        return { passed, failed, total: tests.length };
    }
};
// app/messages/components/MessageHelpers.js
// ✅ KEEP ALL EXISTING CODE, then ADD this at the bottom:

// ===== DATE HELPERS (ADD THIS) =====
const DateHelpers = {
    isSameDay(date1, date2) {
        return (
            date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate()
        );
    },

    formatFullDate(date) {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    },

    getDateLabel(timestamp) {
        const messageDate = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        today.setHours(0, 0, 0, 0);
        yesterday.setHours(0, 0, 0, 0);
        messageDate.setHours(0, 0, 0, 0);

        if (this.isSameDay(messageDate, today)) return "Today";
        if (this.isSameDay(messageDate, yesterday)) return "Yesterday";
        return this.formatFullDate(new Date(timestamp));
    },

    insertDateSeparators(messages) {
        if (!messages || messages.length === 0) return [];

        const result = [];
        let lastDate = null;

        messages.forEach((msg, index) => {
            const msgDate = new Date(msg.timestamp);
            msgDate.setHours(0, 0, 0, 0);

            if (!lastDate || !this.isSameDay(msgDate, lastDate)) {
                result.push({
                    type: 'date-separator',
                    id: `separator-${index}`,
                    date: this.getDateLabel(msg.timestamp)
                });
                lastDate = msgDate;
            }

            result.push({
                type: 'message',
                ...msg
            });
        });

        return result;
    }
};

// ✅ UPDATE THE EXPORT (Replace existing export line)
export { DateHelpers };
export default MessageHelpers;