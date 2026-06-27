// app/messages/components/KeywordTest.js
// Use this to test keyword detection

import MessageHelpers from './MessageHelpers';

const KeywordTest = () => {
    const testMessages = [
        "Let's swap skills!",
        "I want to exchange knowledge",
        "Can we trade expertise?",
        "Professional exchange sounds good",
        "Skill swap would be great",
        "lets swap our skills",
        "let's swap and learn",
        "Just a normal message",
        "SWAP in uppercase",
        "Exchange please",
        "I love trading cards", // Should trigger
    ];

    const runTests = () => {
        console.log('🧪 KEYWORD DETECTION TESTS');
        console.log('=' .repeat(50));
        
        testMessages.forEach((msg, index) => {
            const hasKeywords = MessageHelpers.hasSwapKeywords(msg);
            const status = hasKeywords ? '✅ MATCH' : '❌ NO MATCH';
            console.log(`${index + 1}. ${status} | "${msg}"`);
        });
        
        console.log('=' .repeat(50));
    };

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <button
                onClick={runTests}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded shadow-lg"
            >
                🧪 Test Keywords
            </button>
        </div>
    );
};

export default KeywordTest;


