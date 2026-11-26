create view ligacoes as
select g.id, g.subject as remetente, g.object as destinatario, g.circle as circulo,
  (select array_agg(t.object order by t.id) from triples t
    where t.predicate = 'RECEIVED_TAG' and t.subject = g.object and t.source = g.subject) as tags,
  case when exists (select 1 from triples a where a.predicate = 'ACCEPTED_MIGHT' and a.subject = g.object and a.object = g.subject) then 'aceite'
       when exists (select 1 from triples a where a.predicate = 'REFUSED_MIGHT' and a.subject = g.object and a.object = g.subject) then 'recusado'
       else 'pendente' end as estado,
  g.created_at
from triples g where g.predicate = 'GAVE_MIGHT';

create view participantes as
select n.subject as id, n.object as nome,
  (select g.object from triples g where g.predicate = 'GROUP' and g.subject = n.subject limit 1) as grupo,
  (select array_agg(s.object order by s.id) from triples s where s.predicate = 'SELF_TAG' and s.subject = n.subject) as self_tags,
  (select count(*) from ligacoes l where l.destinatario = n.subject and l.estado = 'aceite') as mights_recebidos,
  (select count(*) from ligacoes l where l.remetente = n.subject) as mights_enviados
from triples n where n.predicate = 'NAME';

grant select on ligacoes, participantes to anon;
