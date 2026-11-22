"""Gera as coordenadas e estados usados pelas animações do PWA. Python 3, sem dependências."""
import json
from math import cos, pi, sin
from pathlib import Path


def vertex(angle, radius):
    return [round(160 + radius * cos(angle), 2), round(79 + radius * sin(angle), 2)]


def rose():
    return [vertex(t, 62 * cos(3 * t)) for t in (i * pi / 90 for i in range(91))]


def regular_polygon(sides, angle, radius):
    return [vertex(angle - pi / 2 + 2 * pi * i / sides, radius) for i in range(sides)]


def sliding_board():
    board = list(range(1, 9)) + [0]
    positions = [board.copy()]
    empty = 8
    for target in (7, 4, 3, 6, 7, 8):
        assert abs(empty // 3 - target // 3) + abs(empty % 3 - target % 3) == 1
        board[empty], board[target] = board[target], board[empty]
        empty = target
        positions.append(board.copy())
    return positions + positions[-2:0:-1]


def walk():
    nodes = [[86, 40], [220, 39], [239, 115], [94, 116]]
    edges = [[0, 1], [1, 2], [2, 3], [3, 0]]
    return {"nodes": nodes, "edges": edges, "route": [0, 1, 2, 3, 0]}


frames = {
    'inicio': rose(),
    'numeros': [
        [[160 + (column - (length - 1) / 2) * min(24, 240 / length),
          79 + (row - (12 // length - 1) / 2) * min(24, 105 / (12 // length))]
         for row in range(12 // length) for column in range(length)]
        for length in (2, 3, 4, 6, 12, 6, 4, 3)
    ],
    'simetrias': [
        regular_polygon(6, i * pi / 90, 61) for i in range(31)
    ],
    'grafos': walk(),
    'fundamentos': ['ABC', 'BAC', 'BCA', 'CBA', 'CAB', 'ACB'],
    'jogos': sliding_board(),
    'trilhas': [[x, 4*x + 1] for x in range(7)],
}

target = Path(__file__).resolve().parent.parent / 'animacoes-dados.js'
target.write_text('// Gerado por scripts/gerar_animacoes.py.\nwindow.animacoesMatematicas = ' +
                  json.dumps(frames, ensure_ascii=False, separators=(',', ':')) +
                  ';\n', encoding='utf-8')
