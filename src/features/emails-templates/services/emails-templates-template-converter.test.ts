import { describe, expect, it } from 'vitest'
import { buildVariableToken, convertPhpToTwig, convertTwigToPhp } from '@/src/features/emails-templates/services/emails-templates-template-converter'

describe('emails-templates-template-converter', () => {
  it('converts basic php echo to twig variable', () => {
    const source = '<p><?php echo $email[\'pedido\'][\'id\']; ?></p>'
    const converted = convertPhpToTwig(source)

    expect(converted).toContain('{{ pedido.id }}')
  })

  it('converts twig variable back to php echo', () => {
    const source = '<p>{{ pedido.id }}</p>'
    const converted = convertTwigToPhp(source)

    expect(converted).toContain("<?php echo $email['pedido']['id']; ?>")
  })

  it('builds variable token for twig and php', () => {
    expect(buildVariableToken('pedido.id', 'twig')).toBe('{{ pedido.id }}')
    expect(buildVariableToken('pedido.id', 'php')).toBe("<?php echo $email['pedido']['id']; ?>")
  })

  it('converts simple php condition blocks to twig', () => {
    const source = "<?php if(!empty($email['pedido']['id'])) { ?>{{ ok }}<?php } else { ?>{{ vazio }}<?php } ?>"
    const converted = convertPhpToTwig(source)

    expect(converted).toContain('{% if pedido.id is not empty %}')
    expect(converted).toContain('{% else %}')
    expect(converted).toContain('{% endif %}')
  })

  it('converts inline php if with echo into twig if block', () => {
    const source = "<?php if(isset($email['pedido']['cupom_desconto'])){ echo '(' . $email['pedido']['cupom_desconto']['codigo'] . ')'; } ?>"
    const converted = convertPhpToTwig(source)

    expect(converted).toContain('{% if pedido.cupom_desconto is defined %}')
    expect(converted).toContain("{{ '(' ~ pedido.cupom_desconto.codigo ~ ')' }}")
    expect(converted).toContain('{% endif %}')
  })

  it('converts number_format with arguments preserving first argument', () => {
    const source = "<?php echo number_format($email['pedido']['valor_total_atendido'],2,'.',''); ?>"
    const converted = convertPhpToTwig(source)

    expect(converted).toContain('{{ (pedido.valor_total_atendido)|number_format }}')
  })
})
