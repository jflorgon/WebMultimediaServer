using Application.Common.Behaviors;
using FluentAssertions;
using FluentValidation;
using MediatR;

namespace Application.Tests.Common;

file sealed record TestRequest(string Value) : IRequest<string>;
file sealed class TestRequestValidator : AbstractValidator<TestRequest>
{
    public TestRequestValidator() =>
        RuleFor(r => r.Value).NotEmpty().WithMessage("Value is required");
}

public sealed class ValidationBehaviorTests
{
    [Fact]
    public async Task Handle_CallsNext_WhenValidationPasses()
    {
        var behavior = new ValidationBehavior<TestRequest, string>([new TestRequestValidator()]);
        var called = false;
        RequestHandlerDelegate<string> next = () => { called = true; return Task.FromResult("ok"); };

        var result = await behavior.Handle(new TestRequest("hello"), next, CancellationToken.None);

        called.Should().BeTrue();
        result.Should().Be("ok");
    }

    [Fact]
    public async Task Handle_ThrowsValidationException_WhenValidationFails()
    {
        var behavior = new ValidationBehavior<TestRequest, string>([new TestRequestValidator()]);
        RequestHandlerDelegate<string> next = () => Task.FromResult("ok");

        var act = () => behavior.Handle(new TestRequest(string.Empty), next, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*Value is required*");
    }

    [Fact]
    public async Task Handle_CallsNext_WhenNoValidators()
    {
        var behavior = new ValidationBehavior<TestRequest, string>([]);
        var called = false;
        RequestHandlerDelegate<string> next = () => { called = true; return Task.FromResult("ok"); };

        await behavior.Handle(new TestRequest(string.Empty), next, CancellationToken.None);

        called.Should().BeTrue();
    }
}
