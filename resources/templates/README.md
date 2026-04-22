# Word Templates

Place your .docx template files in this directory.

## Required Templates

1. **notice_template.docx** - For Notice stage documents
2. **survey_template.docx** - For Survey stage documents
3. **plan_template.docx** - For Plan stage documents
4. **evidence_template.docx** - For Evidence stage documents
5. **working_paper_template.docx** - For Working Paper stage documents
6. **final_report_template.docx** - For Final Report stage documents

## Placeholder Syntax

Use curly braces `{}` for placeholders in your Word documents:

```
Project: {project_name}
Audit Scope: {audit_scope}
Date: {audit_date}
```

## Example Template Content

Each template should contain the structure for that audit stage. The system will replace placeholders with actual data from the audit forms.

## Testing

To test template functionality, create a simple Word document with placeholders and save it here as `test_template.docx`.