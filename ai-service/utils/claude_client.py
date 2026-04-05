"""
Claude API 客户端 (主) + OpenAI 降级备用
使用 AsyncAnthropic + AsyncOpenAI 确保不阻塞 FastAPI 事件循环
"""
import os
import logging
import anthropic
import openai

logger = logging.getLogger(__name__)

_anthropic = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))
_openai = openai.AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY", ""))

CLAUDE_MODEL = "claude-opus-4-6"
OPENAI_MODEL = "gpt-4o"


async def call_claude(
    prompt: str,
    system: str = "",
    max_tokens: int = 2000,
    temperature: float = 0.7,
) -> str:
    """Call Claude API (async). Falls back to OpenAI on failure."""
    try:
        message = await _anthropic.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=max_tokens,
            temperature=temperature,
            system=system,
            messages=[{"role": "user", "content": prompt}],
        )
        return message.content[0].text
    except Exception as e:
        logger.warning(f"Claude API failed, falling back to OpenAI: {e}")
        return await call_openai_fallback(prompt, system, max_tokens, temperature)


async def call_openai_fallback(
    prompt: str,
    system: str = "",
    max_tokens: int = 2000,
    temperature: float = 0.7,
) -> str:
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    response = await _openai.chat.completions.create(
        model=OPENAI_MODEL,
        messages=messages,
        max_tokens=max_tokens,
        temperature=temperature,
    )
    return response.choices[0].message.content or ""
