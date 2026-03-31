---
name: commit-message-korean
description: >-
  Converts Cursor or IDE auto-generated English commit messages into concise Korean
  messages ready to paste into git. Use when the user asks for a Korean commit message,
  wants to replace English SCM suggestions, pastes a feat/fix-style English draft, or
  says phrases like "한글 커밋", "커밋 메시지 한글로", "영문 커밋 번역".
---

# 한글 커밋 메시지 변환

## 목적

Cursor·Git 등에서 **영문으로 자동 생성된 커밋 메시지**를 이 프로젝트 규칙에 맞는 **한글 커밋 메시지**로 바꾼다. 사용자가 **복사해서 그대로 붙여넣기**만 하면 되도록 출력한다.

## 동작 절차

1. 사용자가 제공한 **영문 초안**(제목·본문·불릿)을 읽는다. 없으면 **현재 스테이징/변경 요약**을 물어보거나, 대화에 붙어 있는 초안만으로 진행한다.
2. **Conventional Commits** 접두어는 유지한다: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `style` 등. 접두어 뒤 **설명은 한글**로 쓴다.
3. **첫 줄**: `타입: 한 줄 요약` — 72자 이내를 목표로, 무엇을 왜 바꿨는지 한국어로 명확히.
4. **본문**(필요 시): 한 줄 띄우고 `- ` 불릿으로 변경 사항을 한글로 나열. 원문 불릿 수·의미를 유지하되 번역투·과장은 피한다.
5. **출력 형식**: 최종 커밋 메시지 **전체**만 아래 형태의 **펜스드 코드 블록** 한 개로 준다. 설명 문장은 블록 밖에 최소한만(한 줄 이하) 허용한다.

````markdown
```
(여기에 붙여넣을 한글 커밋 메시지 전체)
```
````

6. 코드 블록 **안**에는 마크다운 헤더(`#`)를 넣지 않는다. 제목 한 줄 + 선택적 본문만.

## 톤·용어

- **존댓말/반말 혼용 금지**: 커밋 메시지는 **해요체/명사형 종결**보다 **개조식·명사구** 위주(예: "추가", "수정", "처리 연결").
- 파일·클래스명·API 경로·Effect 이름 등 **고유명사는 원문 유지**해도 된다 (`DismissBottomSheet`, `PlaceClusterInfoBottomSheetViewModel` 등).
- 사용자 규칙: **커밋 메시지는 한국어**가 기본이다.

## 예시

**입력 (영문 초안)**

```
feat: Add DismissBottomSheet effect to PlaceClusterInfoBottomSheet and PlaceClusterInfoBottomSheetV2

- Implemented DismissBottomSheet effect in PlaceClusterInfoBottomSheetViewModel to handle bottom sheet dismissal.
- Updated UI components to respond to the new effect, enhancing user experience by allowing for proper dismissal of the bottom sheet.
```

**출력 (사용자가 복사할 내용)**

```
feat: 장소 클러스터 바텀시트에 DismissBottomSheet 이펙트 추가

- PlaceClusterInfoBottomSheetViewModel에 바텀시트 닫기용 DismissBottomSheet 이펙트 구현
- PlaceClusterInfoBottomSheet·V2에서 해당 이펙트 처리로 닫기 동작 연결
```

## 하지 말 것

- 영문 초안을 그대로 두고 한글만 덧붙이지 않는다. **최종본은 한글 설명이 중심**이어야 한다.
- 불필요한 메타 설명("아래는 커밋 메시지입니다")을 길게 달지 않는다.
- 사용자가 요청하지 않은 **Co-authored-by**, 이슈 번호 추정 추가는 하지 않는다(명시 시에만).
