class PDFProcessor {
    constructor() {
        this.currentY = null;
        this.currentLine = {};
    }

    processItems(items) {
        const rows = [];
        let currentSection = '';

        items.forEach(item => {
            const { str: text, transform } = item;
            const [, , , , x, y] = transform;

            if (this.isNewLine(y)) {
                if (this.isValidRow(this.currentLine)) {
                    rows.push(this.processRow(this.currentLine, currentSection));
                }
                this.currentLine = {};
                this.currentY = y;
            }

            if (this.isSectionHeader(text)) {
                currentSection = text;
                return;
            }

            this.addToLine(x, text);
        });

        // Process last line
        if (this.isValidRow(this.currentLine)) {
            rows.push(this.processRow(this.currentLine, currentSection));
        }

        return this.cleanRows(rows);
    }

    isNewLine(y) {
        return Math.abs(y - this.currentY) > 5 || this.currentY === null;
    }

    isValidRow(line) {
        return line.activityId && 
               !line.activityId.includes('Activity ID') && 
               !line.activityId.includes('PAGE');
    }

    isSectionHeader(text) {
        return text.match(/^[A-Z\s-]+$/) && 
               !text.includes('REED') && 
               text.length > 3;
    }

    addToLine(x, text) {
        if (x < 100) {
            this.currentLine.activityId = (this.currentLine.activityId || '') + text;
        } else if (x < 300) {
            this.currentLine.activityName = (this.currentLine.activityName || '') + ' ' + text;
        } else if (x < 400) {
            this.currentLine.originalDuration = text;
        } else if (x < 500) {
            this.currentLine.remainingDuration = text;
        } else if (x < 600) {
            this.currentLine.startDate = text;
        } else {
            this.currentLine.finishDate = (this.currentLine.finishDate || '') + ' ' + text;
        }
    }

    processRow(line, section) {
        return {
            section: section,
            activityId: line.activityId?.trim(),
            activityName: line.activityName?.trim(),
            originalDuration: line.originalDuration?.trim() || '0',
            remainingDuration: line.remainingDuration?.trim() || '0',
            startDate: this.cleanDate(line.startDate),
            finishDate: this.cleanDate(line.finishDate)
        };
    }

    cleanDate(date) {
        if (!date) return '';
        return date.trim()
            .replace(/\*/g, '')
            .replace(/\s+/g, ' ');
    }

    cleanRows(rows) {
        return rows.filter(row => 
            row.activityId && 
            row.activityId !== 'Total' && 
            !row.activityId.includes('PAGE')
        );
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PDFProcessor;
}
