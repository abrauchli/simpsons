<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:mw="http://www.mediawiki.org/xml/export-0.6/">
<xsl:output omit-xml-declaration="yes" indent="yes"/>
<xsl:strip-space elements="*"/>

 <xsl:template match="node()|@*">
  <xsl:copy>
    <xsl:apply-templates select="node()|@*"/>
  </xsl:copy>
 </xsl:template>

<!-- <xsl:template match="page[not(ns = '0')]"/> -->
 <xsl:template match="mw:page[mw:ns != '0']" />

</xsl:stylesheet>
