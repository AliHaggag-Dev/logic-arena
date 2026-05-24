import type { BlockNode, BlockType } from "./blockTypes";
import { QUERY_OPTIONS } from "./blockTypes";

const INDENT_UNIT = "  ";
const EMPTY_BRANCH_LINE = "WAIT 1";

const GET_QUERY_TYPES = new Set<string>(QUERY_OPTIONS);

function asString(value: string | number | boolean | undefined, fallback: string): string {
  if (value === undefined) return fallback;
  return String(value);
}

function indentLine(line: string, indent: number): string {
  return `${INDENT_UNIT.repeat(indent)}${line}`;
}

function generateBranch(blocks: BlockNode[] | undefined, indent: number): string[] {
  const branchLines = generateLines(blocks ?? [], indent);
  return branchLines.length > 0 ? branchLines : [indentLine(EMPTY_BRANCH_LINE, indent)];
}

function actionLine(type: BlockType): string {
  return type;
}

function generateBlockLines(block: BlockNode, indent: number): string[] {
  const inputs = block.inputs;

  if (GET_QUERY_TYPES.has(block.type)) {
    return [indentLine(block.type, indent)];
  }

  switch (block.type) {
    case "MOVE":
    case "MOVE_FAST":
    case "BACKUP":
    case "FIRE":
    case "BURST_FIRE":
    case "SHIELD":
    case "CLOAK":
    case "MINE":
    case "SCAN":
    case "PATHFIND":
    case "STOP":
    case "BREAK":
    case "CONTINUE":
    case "RETURN":
      return [indentLine(actionLine(block.type), indent)];
    case "TELEPORT":
      return [indentLine(`TELEPORT (${asString(inputs.x, "400")}, ${asString(inputs.y, "300")})`, indent)];
    case "DASH":
      return [indentLine(`DASH (${asString(inputs.distance, "80")})`, indent)];
    case "TAUNT":
      return [indentLine(`TAUNT (${asString(inputs.message, '"COME AT ME"')})`, indent)];
    case "WAIT":
      return [indentLine(`WAIT ${asString(inputs.ticks, "1")}`, indent)];
    case "IF_THEN":
      return [
        indentLine(`IF ${asString(inputs.condition, "TRUE")} THEN`, indent),
        ...generateBranch(block.children, indent + 1),
        indentLine("END", indent),
      ];
    case "IF_THEN_ELSE":
      return [
        indentLine(`IF ${asString(inputs.condition, "TRUE")} THEN`, indent),
        ...generateBranch(block.children, indent + 1),
        indentLine("ELSE", indent),
        ...generateBranch(block.elseChildren, indent + 1),
        indentLine("END", indent),
      ];
    case "WHILE_DO":
      return [
        indentLine(`WHILE ${asString(inputs.condition, "TRUE")} DO`, indent),
        ...generateBranch(block.children, indent + 1),
        indentLine("END", indent),
      ];
    case "FOR_LOOP":
      return [
        indentLine(`FOR ${asString(inputs.iterator, "i")} = ${asString(inputs.start, "0")} TO ${asString(inputs.end, "0")} DO`, indent),
        ...generateBranch(block.children, indent + 1),
        indentLine("END", indent),
      ];
    case "FUNCTION_DEF":
      return [
        indentLine(`FUNCTION ${asString(inputs.name, "routine")}`, indent),
        ...generateBranch(block.children, indent + 1),
        indentLine("END", indent),
      ];
    case "CALL_FUNCTION":
      return [indentLine(`CALL ${asString(inputs.name, "routine")}`, indent)];
    case "SET_VAR":
      return [indentLine(`SET ${asString(inputs.target, "value")} = ${asString(inputs.value, "0")}`, indent)];
    case "UPDATE_VAR":
      return [indentLine(`SET ${asString(inputs.target, "value")} = ${asString(inputs.target, "value")} ${asString(inputs.operator, "+")} ${asString(inputs.value, "1")}`, indent)];
    case "CREATE_ARRAY":
      return [indentLine(`SET ${asString(inputs.target, "items")} = [${asString(inputs.values, "")}]`, indent)];
    case "CREATE_DICT":
      return [indentLine(`SET ${asString(inputs.target, "state")} = { ${asString(inputs.entries, "")} }`, indent)];
    case "ARRAY_PUSH":
      return [indentLine(`SET count = PUSH(${asString(inputs.target, "items")}, ${asString(inputs.value, "0")})`, indent)];
    case "ARRAY_POP":
      return [indentLine(`SET ${asString(inputs.target, "last")} = POP(${asString(inputs.source, "items")})`, indent)];
    case "DICT_SET":
      return [indentLine(`SET ${asString(inputs.target, "state.mode")} = ${asString(inputs.value, '"SCAN"')}`, indent)];
    case "QUERY_SENSOR":
      return [indentLine(`${asString(inputs.query, "GET_HEALTH")}`, indent)];
    case "SET_FUNCTION":
      return [indentLine(`SET ${asString(inputs.target, "value")} = ${asString(inputs.expression, "RANDOM()")}`, indent)];
    case "BROADCAST":
      return [indentLine(`BROADCAST(${asString(inputs.payload, "state")})`, indent)];
    case "RECEIVE_INBOX":
      return [indentLine(`SET ${asString(inputs.target, "messages")} = RECEIVE()`, indent)];
    default:
      return [];
  }
}

function generateLines(blocks: BlockNode[], indent: number): string[] {
  return blocks.flatMap((block) => generateBlockLines(block, indent));
}

export function generateScript(blocks: BlockNode[], indent = 0): string {
  return generateLines(blocks, indent).join("\n");
}
