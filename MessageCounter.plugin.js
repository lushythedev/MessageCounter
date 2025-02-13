/**
 * @name MessageCounter
 * @author Lushy
 * @description Counts messages in a specific Discord server and displays the count in a floating window.
 * @version 1.0.0
 * @source https://github.com/lushythedev/MessageCounter
 */

module.exports = class MessageCounter {
    constructor() {
        this.initialize();
    }

    initialize() {
        this.messageCount = 0;
        this.displayElement = null;
        this.observer = null;
        this.targetServerId = "1328046584390225950";
    }

    start() {
        console.log("MessageCounter: Starting...");
        this.initialize();
        this.createCounterDisplay();
        this.setupMessageCounter();
    }

    stop() {
        console.log("MessageCounter: Stopping...");
        if (this.displayElement) {
            this.displayElement.remove();
        }
        if (this.observer) {
            this.observer.disconnect();
        }
    }

    createCounterDisplay() {
        this.displayElement = document.createElement('div');
        Object.assign(this.displayElement.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: '#fff',
            padding: '8px 12px',
            fontSize: '14px',
            borderRadius: '8px',
            zIndex: '9999'
        });
        this.updateCounter();
        document.body.appendChild(this.displayElement);
    }

    updateCounter() {
        if (this.displayElement) {
            this.displayElement.textContent = `Messages: ${this.messageCount}`;
        }
    }

    getCurrentServerId() {
        try {
            // Try to get server ID from URL first
            const match = window.location.pathname.match(/\/channels\/(\d+)/);
            return match ? match[1] : null;
        } catch (e) {
            console.error('Error getting server ID:', e);
            return null;
        }
    }

    setupMessageCounter() {
        const config = { 
            childList: true, 
            subtree: true,
            attributes: false,
            characterData: false
        };

        // Create our message observer
        this.observer = new MutationObserver((mutations) => {
            const currentServerId = this.getCurrentServerId();
            
            if (currentServerId === this.targetServerId) {
                for (const mutation of mutations) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === 1) { // ELEMENT_NODE
                            // Check for any message-related elements
                            const isMessage = 
                                node.classList?.contains('message-') ||
                                node.classList?.contains('messageListItem-') ||
                                node.classList?.contains('full-motion') ||
                                node.querySelector?.('[class*="message-"], [class*="messageListItem-"]');

                            if (isMessage) {
                                // Verify it's a new message by checking for timestamp
                                const hasTimestamp = node.querySelector('[class*="timestamp-"]');
                                if (hasTimestamp) {
                                    console.log("MessageCounter: New message detected");
                                    this.messageCount++;
                                    this.updateCounter();
                                }
                            }
                        }
                    }
                }
            }
        });

        // Function to start observing chat
        const startObserving = () => {
            // Try multiple possible selectors for the chat container
            const chatSelectors = [
                '.chat-',
                '.chatContent-',
                '.messages-',
                '.scroller-',
                '.show-redesigned-icons',
                '[class*="chat-"]',
                '[class*="chatContent-"]',
                '[class*="messages-"]'
            ];

            let chatContainer = null;
            for (const selector of chatSelectors) {
                chatContainer = document.querySelector(selector);
                if (chatContainer) break;
            }

            if (chatContainer && !this.observer.observing) {
                console.log("MessageCounter: Found chat container, setting up observer");
                this.observer.observe(chatContainer, config);
                this.observer.observing = true;
            }
        };

        // Try to start observing immediately
        startObserving();

        // Also watch for chat area to be added
        const appObserver = new MutationObserver(() => {
            if (!this.observer.observing) {
                startObserving();
            }
        });

        const app = document.querySelector('#app-mount');
        if (app) {
            appObserver.observe(app, {
                childList: true,
                subtree: true
            });
        }
    }
}
