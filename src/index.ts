import ts from "typescript";

function transformer(program: ts.Program) {
  return function (context: ts.TransformationContext) {
    return function (sourceFile: ts.SourceFile) {
      function visit(node: ts.Node): ts.Node {
        // 检查是否是属性声明节点
        if (ts.isPropertyDeclaration(node)) {
          // 遍历修饰符（包括装饰器）
          const decorators = (node.modifiers || []).map((modifier: ts.Decorator) => {
            // 检查是否是装饰器
            if (ts.isDecorator(modifier)) {
              const decoratorExpression = modifier.expression;
              // 检查是否是装饰器调用（如 @a()）
              let type;
              if (ts.isCallExpression(decoratorExpression) &&
                ts.isIdentifier(decoratorExpression.expression) &&
                (decoratorExpression.expression.text === 'autowired' || decoratorExpression.expression.text === 'reactiveAutowired') &&
                node.type &&
                ts.isTypeReferenceNode(node.type) &&
                (type = node.type.getText(sourceFile)) &&
                ['String', "Number", "Boolean", "Object", "Array", "Function", "Symbol"].indexOf(type) === -1
              ) {
                // 创建类型字符串字面量节点
                const args = type ? [ts.factory.createIdentifier(type)] : [];
                // 修改装饰器调用，将类型作为参数传递
                return ts.factory.updateDecorator(
                  modifier,
                  ts.factory.updateCallExpression(
                    decoratorExpression,
                    decoratorExpression.expression,
                    undefined,
                    args
                  )
                );
              }
            }
            return modifier;
          });

          // 更新属性声明节点
          return ts.factory.updatePropertyDeclaration(
            node,
            decorators,
            node.name,
            node.questionToken,
            node.type,
            node.initializer
          );
        }
        return ts.visitEachChild(node, visit, context);
      }
      return ts.visitNode(sourceFile, visit);
    };
  };
}

export default transformer;
