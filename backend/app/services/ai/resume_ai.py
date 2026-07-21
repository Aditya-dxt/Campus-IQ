"""
Resume AI integration service.

This module is responsible for communicating with the
Resume Scoring model.

Currently this is only an interface.
The ML model will be integrated later.
"""


def analyze_resume(parsed_text: str) -> dict:
    """
    Analyze parsed resume text.

    Parameters
    ----------
    parsed_text : str
        Extracted resume text.

    Returns
    -------
    dict
        Placeholder response.
    """

    return {
        "status": "pending",
        "message": "Resume model not integrated yet."
    }