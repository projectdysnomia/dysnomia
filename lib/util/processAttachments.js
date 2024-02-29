function processAttachments(attachments) {
    if(!attachments) {
        return {};
    }
    const files = [];
    const resultAttachments = [];

    attachments.forEach((attachment, idx) => {
        if(attachment.id) {
            resultAttachments.push(attachment);
        } else {
            files.push({
                fieldName: `files[${idx}]`,
                file: attachment.file,
                name: attachment.filename
            });

            resultAttachments.push({
                ...attachment,
                file: undefined,
                id: idx
            });
        }
    });

    return {
        files: files.length ? files : undefined,
        attachments: resultAttachments
    };
}

module.exports = processAttachments;
