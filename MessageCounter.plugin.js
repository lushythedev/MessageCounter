/**
 * @name MessageCounter
 * @author Lushy
 * @description Counts messages in a specific Discord server and displays the count in a floating window.
 * @version 1.0.0
 * @source https://github.com/lushythedev/MessageCounter
 */

module.exports = class MessageCounter {
    start() {
        console.log("MessageCounter: Starting...");
        this.messageCount = 0;
        this.displayElement = null;
        this.targetServerId = "1328046584390225950";
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
        const match = window.location.href.match(/channels\/(\d+)/);
        return match ? match[1] : null;
    }

    setupMessageCounter() {
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Check if it's an element node
                        const isMessage = 
                            node.classList?.contains('message-') || 
                            node.querySelector?.('[class*="message-"]');
                            
                        if (isMessage) {
                            const currentServerId = this.getCurrentServerId();
                            if (currentServerId === this.targetServerId) {
                                this.messageCount++;
                                this.updateCounter();
                            }
                        }
                    }
                });
            });
        });

        // Start observing the chat area
        const setupObserver = () => {
            const chatArea = document.querySelector('[class*="chat-"], [class*="chatContent-"], [class*="messages-"]');
            if (chatArea) {
                this.observer.observe(chatArea, {
                    childList: true,
                    subtree: true
                });
            }
        };

        // Try to set up immediately
        setupObserver();

        // Also watch for chat area to be added
        const appObserver = new MutationObserver(() => {
            setupObserver();
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
